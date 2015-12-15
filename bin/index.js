#!/usr/bin/env node
var path      = require('path');
var diff      = require(path.join("../", "index.js"));
var minimist  = require('minimist');

var args = minimist(process.argv.slice(2));

diff({
  files: args["_"] || [],
  visual: args["v"] || args["visual"] || false,
  omit: args["o"] || args["omit"] || []
})
.done(function(diff) {
  if (options.visual) {
    process.stdout.write(diff.visual);
  }

  process.stdout.write(diff.different+"\n");
  process.exit(0);
});
