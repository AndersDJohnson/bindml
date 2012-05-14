do ->
	name = "bindml"
	
	factory = ($, _, jsonPath) ->
		exports = {}
		
		tokens =
			local: '$$'

		templates = {}
		exports.register = register = (name, template) ->
			templates[name] = template

		exports.render = render = (name, data, opts = {}) ->
	
			opts = _.defaults opts, {
				tidy: false
			}
			
			if window?.jQuery?
				$top = $(templates[name])
				html = $top.html()
				if not html? or html is ""
					$top = $("<div>#{templates[name]}</div>")
			else
				$ = $.load templates[name]
				$top = $($.dom())
				
			keyToValue = (key) ->
				expr = "$.#{key}"
				results = jsonPath data, expr
				return results
	
			resolveJSONPaths = (paths) ->
				resolved = []
				for path in paths
					path = path.replace /^\$\$/, ''
					resolved.push path
				return resolved.join ""
	
			getAttrs = ($elem) ->
				elem = $elem.get(0)
				attrs = {}
				if elem.attributes?
					for attr in elem.attributes
						attrs[attr.name] = attr.value
				else if elem.attribs?
					attrs = elem.attribs
				return attrs
	
			getAttr = ($elem) ->
				if $elem.attr("data-bind")?
					return "data-bind"
				else if $elem.attr("data-with")?
					return "data-with"
				else if $elem.attr("data-each")?
					return "data-each"
				#else if $elem.attr("data-attr")?
				#	return "data-attr"
				return false
	
			doIncludes = ($context) ->
				$includes = $("[data-include]", $context)
				$includes.each((index, elem) ->
					$elem = $(elem)
					key = $elem.attr("data-include")
					included = templates[key]
					if included?
						wrapper = "<div data-partial-wrapper>#{included}</div>"
						$included = $(wrapper)
						$elem.replaceWith $included.html()
						doIncludes $included
				)
	
			fillAttrs = ($elem, scope) ->
				attrs = getAttrs($elem)
				for key, value of attrs
					match = key.match /^data-attr-(.+)$/
					if match?
						subscope = scope
						subscope += "." if scope isnt ""
						subscope += value
						val = keyToValue(subscope)[0]
						$elem.attr(match[1], val)
						$elem.removeAttr(match[0])
				$elem.removeAttr("data-attr")
	
			doClasses = ($elem, scope) ->
				value = $elem.attr("data-classes")
				values = value.split /\s+/
				for value in values
					match = value.match /^(.*?)(\?(.*?)(\:(.*))?)?$/
					if match?
						property = match[1]
						subscope = scope
						subscope += "." if scope isnt ""
						subscope += property
						val = keyToValue(subscope)[0]
						trueClass = match[3]
						falseClass = match[5]
						if val
							if trueClass?
								$elem.addClass trueClass
							else
								$elem.addClass value[0]
						else if falseClass?
							$elem.addClass falseClass
				$elem.removeAttr("data-classes")
	
			doScopes = ($contexts, scope="") ->
				scopeSelector = "[data-with], [data-each], [data-bind], [data-attr], [data-classes]"
				$contexts.each((index, elem) ->
					$context = $(elem)
					$do = $context.find(scopeSelector).not("[data-processed]").first()
					while $do.size() > 0
				
						attr = getAttr($do)
						subscope = scope
						subscope += "." if scope isnt ""
						subscope += $do.attr(attr)
				
						if $do.attr("data-attr")?
							fillAttrs($do, scope)
				
						if $do.attr("data-classes")?
							doClasses($do, scope)
				
						$do.attr("data-processed", "data-processed")
						switch attr
							when "data-each"
								val = keyToValue(subscope)[0]
								_.each(val, (elem, index) ->
									$doClone = $do.clone()
									$doClone.attr("data-each", subscope)
									subscopei = subscope + "[#{index}]"
									$doClone.attr("data-bind", subscopei)
									fillAttrs($doClone, subscopei)
									$doClone.attr("data-processed", "data-processed")
									doScopes($doClone.children(), subscopei)
									$do.before($doClone)
								)
								$do.remove()
							when "data-bind"
								val = keyToValue(subscope)[0]
								$do.html(val)
								$do.attr("data-bind", subscope)
								fillAttrs($do, subscope)
								doScopes($do.children(), subscope)
							when "data-with"
								$do.attr(attr, subscope)
								fillAttrs($do, subscope)
								doScopes($do.children(), subscope)
				
				
				
						$do = $context.find(scopeSelector).not("[data-processed]").first()
				)
	
			doIncludes $top
			doScopes $top
	
			$("[data-processed]").removeAttr("data-processed")
			
			if window?.jQuery?
				return $top.html()
			else # cheerio
				if opts.tidy and $.tidy?
					return $.tidy()
				else
					return $.html()
		
		return exports
	
	# universal module wrapper (CommonJS, AMD/RequireJS, and plain browser support)
	if define?
		define ["jquery", "underscore", "jsonPath"], factory
	else if module?.exports?
		cheerio = require "cheerio-AndersDJohnson"
		jsonPath = require("JSONPath").eval
		_ = require "underscore"
		module.exports = exports = factory(cheerio, _, jsonPath)
	else if window?
		window[name] = factory(jQuery, _, jsonPath)
	

