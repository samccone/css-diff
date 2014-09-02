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
