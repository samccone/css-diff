var Promise   = require('bluebird');
var Read      = Promise.promisify(require('fs').readFile);
var Path      = require('path');
var CleanCSS  = require('clean-css');

var compilers = {
  ".css": function(path) {
    return Read(path, "utf8");
  },

  ".styl": function(path) {
    var renderer;
    try {
      renderer = Promise.promisify(require('stylus').render);
    } catch (e) {
      return new Error("you must npm install stylus to compile stylus files")
    }

    return Read(path, "utf8").then(renderer)
  },

  ".scss": function(path) {
    var renderer;
    try {
      renderer = require('node-sass').render;
    } catch (e) {
      return new Error("you must npm install node-sass to compile sass files")
    }

    return new Promise(function (resolve, reject) {
      renderer({
        file: path,
        success: resolve,
        error: function(e) {
          reject(new Error(JSON.stringify(e, null, 4)));
        }
      })
    });
  }
};

module.exports = function(path) {
  if (compiler = compilers[Path.extname(path)]) {
    return compiler(path).then(function(css) {
      return CleanCSS().minify(css);
    });
  } else {
    throw(new Error(Path.extname(path) + " files are not supported. \n ask for it here https://github.com/samccone/css-diff"))
  }
}
