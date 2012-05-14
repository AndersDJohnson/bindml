(function() {
  var cheerio, fs, jsonPath, register, render, soupselect, templates, tokens, _;

  cheerio = require("cheerio-AndersDJohnson");

  soupselect = require("cheerio-soupselect");

  fs = require("promised-io/fs");

  jsonPath = require("JSONPath");

  _ = require("underscore");

  tokens = {
    local: '$$'
  };

  templates = {};

  module.exports.register = exports.register = register = function(name, template) {
    return templates[name] = template;
  };

  module.exports.render = exports.render = render = function(name, data, opts) {
    var $, $top, doIncludes, doScopes, getAttr, keyToValue, resolveJSONPaths;
    if (opts == null) opts = {};
    $ = cheerio.load(templates[name]);
    keyToValue = function(key) {
      var expr, results;
      expr = "$." + key;
      results = jsonPath.eval(data, expr);
      return results;
    };
    $top = $($.dom());
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
    getAttr = function($elem) {
      var attr;
      if ($elem.attr("data-bind") != null) {
        attr = "data-bind";
      } else if ($elem.attr("data-with") != null) {
        attr = "data-with";
      } else if ($elem.attr("data-each") != null) {
        attr = "data-each";
      } else {
        attr = false;
      }
      return attr;
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
    doScopes = function($contexts, scope) {
      var scopeSelector;
      if (scope == null) scope = "";
      scopeSelector = "[data-with], [data-each], [data-bind]";
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
              doScopes($do.children(), subscope);
              break;
            case "data-with":
              $do.attr(attr, subscope);
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
    return $.tidy();
  };

}).call(this);
