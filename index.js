require('colors');

var cssParse  = require('css-parse');
var Promise   = require('bluebird');
var Diff      = require('diff')
var Read      = Promise.promisify(require('fs').readFile);

module.exports = function(options) {
  this.options = options;

  return getContents(options.files)
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
  if (files.length < 2) {
    return new Error("you must pass 2 file paths in")
  }

  return Promise.all(files.map(function(path) {
    return Read(path, "utf8")
    .then(function(contents) {
      return JSON.stringify(cssParse(contents).stylesheet.rules, null, 4)
    });
  }));
}