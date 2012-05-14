cheerio = require "cheerio-AndersDJohnson"
soupselect = require "cheerio-soupselect"
fs = require "promised-io/fs"
jsonPath = require "JSONPath"
_ = require "underscore"

tokens =
	local: '$$'

templates = {}
module.exports.register = exports.register = register = (name, template) ->
	templates[name] = template

module.exports.render = exports.render = render = (name, data, opts = {}) ->
	
	$ = cheerio.load templates[name]
	
	keyToValue = (key) ->
		expr = "$.#{key}"
		results = jsonPath.eval data, expr
		return results
	
	$top = $($.dom())
	
	resolveJSONPaths = (paths) ->
		resolved = []
		for path in paths
			path = path.replace /^\$\$/, ''
			resolved.push path
		return resolved.join ""
	
	getAttr = ($elem) ->
		if $elem.attr("data-bind")?
			attr = "data-bind"
		else if $elem.attr("data-with")?
			attr = "data-with"
		else if $elem.attr("data-each")?
			attr = "data-each"
		else attr = false
		return attr
	
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
	
	doScopes = ($contexts, scope="") ->
		scopeSelector = "[data-with], [data-each], [data-bind]"
		$contexts.each((index, elem) ->
			$context = $(elem)
			$do = $context.find(scopeSelector).not("[data-processed]").first()
			while $do.size() > 0
				attr = getAttr($do)
				subscope = scope
				subscope += "." if scope isnt ""
				subscope += $do.attr(attr)
				$do.attr("data-processed", "data-processed")
				switch attr
					when "data-each"
						val = keyToValue(subscope)[0]
						_.each(val, (elem, index) ->
							$doClone = $do.clone()
							$doClone.attr("data-each", subscope)
							subscopei = subscope + "[#{index}]"
							$doClone.attr("data-bind", subscopei)
							$doClone.attr("data-processed", "data-processed")
							doScopes($doClone.children(), subscopei)
							$do.before($doClone)
						)
						$do.remove()
					when "data-bind"
						val = keyToValue(subscope)[0]
						$do.html(val)
						$do.attr("data-bind", subscope)
						doScopes($do.children(), subscope)
					when "data-with"
						$do.attr(attr, subscope)
						doScopes($do.children(), subscope)
				$do = $context.find(scopeSelector).not("[data-processed]").first()
		)
	
	doIncludes $top
	doScopes $top
	
	$("[data-processed]").removeAttr("data-processed")
	
	return $.tidy()

