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
  process.stderr.write(e);
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
  var openSelector = false;
  var selectorCount = 0;

  var markedCss = diff.map(function(part) {
    var output = "";
    var mode = "";

    if(part.removed) {
      return output;
    }

    if(part.value.indexOf('"selectors"') !== -1 && part.value.indexOf('"declarations"') !== -1) {
      mode = 'selector-declaration';

      if(part.value.lastIndexOf('"selectors"') > part.value.lastIndexOf('"declarations"')) {
        mode = 'selector';
      }
      else {
        mode = 'declaration';
      }
    }
    else if(part.value.indexOf('"selectors"') !== -1) {
      mode = 'selector';
    }
    else if(part.value.indexOf('"declarations"') !== -1) {
      mode = 'declaration';
    }
    else {
      mode = 'property';
    }

    if(openSelector) {
      if(selectorCount > 0) {
        output += ", ";
      }
    }

    if(mode == 'selector-declaration') {
      openSelector = false;
      selectorCount = 0;

      output += part.value;
    }
    else if(mode == 'selector') {
      openSelector = true;
      selectorCount = 0;

      output += part.value;
    }
    else if(mode == 'declaration') {
      openSelector = false;
      selectorCount = 0;

      output += part.value;
    }
    else if(mode == 'property') {
      // selector
      if(openSelector) {
        part.value = JSON.stringify({
          type: "selector",
          selector: part.value,
          changed: part.added
        });

        output += part.value;

        selectorCount += 1;
      }

      // property
      else {
        output += part.value;

        if(part.added) {
          output += '\n, "changed": "true"';
        }
      }
    }
    else {
      output += part.value;
    }

    return output;
  });

  markedCss = markedCss.join('');

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
      var item = selector.selector || selector;

      item = item.trim();
      if(item.lastIndexOf(',') === (item.length - 1)) item = item.substr(0, item.length - 1);
      if(item.lastIndexOf('"') === (item.length - 1)) item = item.substr(0, item.length - 1);
      if(item.indexOf('"') === 0) item = item.substr(1);

      prev += item;

      prev += ' {';
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
