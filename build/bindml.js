(function() {

  (function() {
    var cheerio, exports, factory, jsonPath, name, _;
    name = "bindml";
    factory = function($, _, jsonPath) {
      var exports, register, render, templates, tokens;
      exports = {};
      tokens = {
        local: '$$'
      };
      templates = {};
      exports.register = register = function(name, template) {
        return templates[name] = template;
      };
      exports.render = render = function(name, data, opts) {
        var $top, doClasses, doIncludes, doScopes, fillAttrs, getAttr, getAttrs, html, keyToValue, resolveJSONPaths;
        if (opts == null) opts = {};
        opts = _.defaults(opts, {
          tidy: false
        });
        if ((typeof window !== "undefined" && window !== null ? window.jQuery : void 0) != null) {
          $top = $(templates[name]);
          html = $top.html();
          if (!(html != null) || html === "") {
            $top = $("<div>" + templates[name] + "</div>");
          }
        } else {
          $ = $.load(templates[name]);
          $top = $($.dom());
        }
        keyToValue = function(key) {
          var expr, results;
          expr = "$." + key;
          results = jsonPath(data, expr);
          return results;
        };
        resolveJSONPaths = function(paths) {
          var path, resolved, _i, _len;
          resolved = [];
          for (_i = 0, _len = paths.length; _i < _len; _i++) {
            path = paths[_i];
            path = path.replace(/^\$\$/, '');
            resolved.push(path);
          }
          return resolved.join("");
        };
        getAttrs = function($elem) {
          var attr, attrs, elem, _i, _len, _ref;
          elem = $elem.get(0);
          attrs = {};
          if (elem.attributes != null) {
            _ref = elem.attributes;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              attr = _ref[_i];
              attrs[attr.name] = attr.value;
            }
          } else if (elem.attribs != null) {
            attrs = elem.attribs;
          }
          return attrs;
        };
        getAttr = function($elem) {
          if ($elem.attr("data-bind") != null) {
            return "data-bind";
          } else if ($elem.attr("data-with") != null) {
            return "data-with";
          } else if ($elem.attr("data-each") != null) {
            return "data-each";
          }
          return false;
        };
        doIncludes = function($context) {
          var $includes;
          $includes = $("[data-include]", $context);
          return $includes.each(function(index, elem) {
            var $elem, $included, included, key, wrapper;
            $elem = $(elem);
            key = $elem.attr("data-include");
            included = templates[key];
            if (included != null) {
              wrapper = "<div data-partial-wrapper>" + included + "</div>";
              $included = $(wrapper);
              $elem.replaceWith($included.html());
              return doIncludes($included);
            }
          });
        };
        fillAttrs = function($elem, scope) {
          var attrs, key, match, subscope, val, value;
          attrs = getAttrs($elem);
          for (key in attrs) {
            value = attrs[key];
            match = key.match(/^data-attr-(.+)$/);
            if (match != null) {
              subscope = scope;
              if (scope !== "") subscope += ".";
              subscope += value;
              val = keyToValue(subscope)[0];
              $elem.attr(match[1], val);
              $elem.removeAttr(match[0]);
            }
          }
          return $elem.removeAttr("data-attr");
        };
        doClasses = function($elem, scope) {
          var falseClass, match, property, subscope, trueClass, val, value, values, _i, _len;
          value = $elem.attr("data-classes");
          values = value.split(/\s+/);
          for (_i = 0, _len = values.length; _i < _len; _i++) {
            value = values[_i];
            match = value.match(/^(.*?)(\?(.*?)(\:(.*))?)?$/);
            if (match != null) {
              property = match[1];
              subscope = scope;
              if (scope !== "") subscope += ".";
              subscope += property;
              val = keyToValue(subscope)[0];
              trueClass = match[3];
              falseClass = match[5];
              if (val) {
                if (trueClass != null) {
                  $elem.addClass(trueClass);
                } else {
                  $elem.addClass(value[0]);
                }
              } else if (falseClass != null) {
                $elem.addClass(falseClass);
              }
            }
          }
          return $elem.removeAttr("data-classes");
        };
        doScopes = function($contexts, scope) {
          var scopeSelector;
          if (scope == null) scope = "";
          scopeSelector = "[data-with], [data-each], [data-bind], [data-attr], [data-classes]";
          return $contexts.each(function(index, elem) {
            var $context, $do, attr, subscope, val, _results;
            $context = $(elem);
            $do = $context.find(scopeSelector).not("[data-processed]").first();
            _results = [];
            while ($do.size() > 0) {
              attr = getAttr($do);
              subscope = scope;
              if (scope !== "") subscope += ".";
              subscope += $do.attr(attr);
              if ($do.attr("data-attr") != null) fillAttrs($do, scope);
              if ($do.attr("data-classes") != null) doClasses($do, scope);
              $do.attr("data-processed", "data-processed");
              switch (attr) {
                case "data-each":
                  val = keyToValue(subscope)[0];
                  _.each(val, function(elem, index) {
                    var $doClone, subscopei;
                    $doClone = $do.clone();
                    $doClone.attr("data-each", subscope);
                    subscopei = subscope + ("[" + index + "]");
                    $doClone.attr("data-bind", subscopei);
                    fillAttrs($doClone, subscopei);
                    $doClone.attr("data-processed", "data-processed");
                    doScopes($doClone.children(), subscopei);
                    return $do.before($doClone);
                  });
                  $do.remove();
                  break;
                case "data-bind":
                  val = keyToValue(subscope)[0];
                  $do.html(val);
                  $do.attr("data-bind", subscope);
                  fillAttrs($do, subscope);
                  doScopes($do.children(), subscope);
                  break;
                case "data-with":
                  $do.attr(attr, subscope);
                  fillAttrs($do, subscope);
                  doScopes($do.children(), subscope);
              }
              _results.push($do = $context.find(scopeSelector).not("[data-processed]").first());
            }
            return _results;
          });
        };
        doIncludes($top);
        doScopes($top);
        $("[data-processed]").removeAttr("data-processed");
        if ((typeof window !== "undefined" && window !== null ? window.jQuery : void 0) != null) {
          return $top.html();
        } else {
          if (opts.tidy && ($.tidy != null)) {
            return $.tidy();
          } else {
            return $.html();
          }
        }
      };
      return exports;
    };
    if (typeof define !== "undefined" && define !== null) {
      return define(["jquery", "underscore", "jsonPath"], factory);
    } else if ((typeof module !== "undefined" && module !== null ? module.exports : void 0) != null) {
      cheerio = require("cheerio-AndersDJohnson");
      jsonPath = require("JSONPath").eval;
      _ = require("underscore");
      return module.exports = exports = factory(cheerio, _, jsonPath);
    } else if (typeof window !== "undefined" && window !== null) {
      return window[name] = factory(jQuery, _, jsonPath);
    }
  })();

}).call(this);
