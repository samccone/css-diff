require('colors');

var cssParse  = require('css-parse');
var Promise   = require('bluebird');
var Diff      = require('diff');
var Compiler  = require("./lib/compiler.js");
var Path      = require('path');

module.exports = function(options) {
  this.options = options;

  return getContents.call(this, options.files)
  .spread(Diff.diffLines)
  .then(generateDiff)
  .catch(handleError)
}

function handleError(e) {
  process.stderr.write(("Error: "+e.message+"\n").red.inverse);
  process.exit(1);
}

function generateDiff(diff) {
  var _this = this;
  if (_this.options.updates) {
      return generateUpdatesDiff(diff);
  }
  return generateOrigDiff(diff);
}

function generateUpdatesDiff(diff) {
  var markedCss = diff.reduce(function(prev, part) {
    return prev + (part.added || (!part.added && !part.removed) ? part.value : "") + (part.added ? '\n, "changed": "true"' : "");
  }, "");
  var changedRules = JSON.parse(markedCss)
  .filter(function(o) {
    return o.type === "rule";
  })
  .reduce(function(prev, rule) {
    var declarations = rule.declarations.reduce(function(prev, declaration) {
      if (declaration.changed) prev.push(declaration);
      return prev;
    }, []);
    if (declarations.length) prev.push({
      type: rule.type,
      selectors: rule.selectors,
      declarations: declarations
    });
    return prev;
  }, []);
  var updates = changedRules.reduce(function(prev, rule) {
    rule.selectors.forEach(function(selector) {
      prev += selector + '{';
      rule.declarations.forEach(function(declaration) {
        prev += declaration.property + ':' + declaration.value + ';';
      });
      prev += '}\n';
    });
    return prev;
  }, "");
  return {
    updates: updates
  };
}

function generateOrigDiff(diff) {
  var different   = false;
  var visual      = diff.reduce(function(prev, part) {
    var color = part.added ? "green" : part.removed ? "red" : "grey";

    if (color !== "grey") { different = true;}

    return prev + part.value[color] + "\n"
  }, "")

  return {
    different: different,
    visual: visual
  }
}

function getContents(files) {
  var _this = this;

  if (files.length < 2) {
    return new Error("you must pass 2 file paths in")
  }

  return Promise.all(files.map(function(path) {
    return Compiler(Path.resolve(path))
    .then(function(css) {
      var rules = cssParse(css).stylesheet.rules;

      return JSON.stringify(rules.filter(function(rule) {
        return !~_this.options.omit.indexOf(rule.type)
      }), null, 4)
    });
  }));
}
