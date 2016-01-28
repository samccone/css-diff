CSS Diff
--------

Compare two CSS/STYLUS/SCSS files at a [Parse Tree][1] level.
Useful when you are comparing the output of two versions of a library implemented in different preprocessor libraries.
This tool makes it simple to see if the compiled output of a stylus file matches the compiled output of a scss file.

# Using

## Command Line

The command line interface takes 2 paths to css/styl/scss files as well as an options `-v` or `--visual` argument to print the diff or `-u` or `--updates` argument to print updated rules. The return value of the invokation with be `true` or `false`.

* `$ npm install css-diff`
* `$ node_modules/.bin/css-diff path/to/file.styl path/to/file2.css -v`

## In your code

* `$ npm install css-diff --save`

```js
require("css-diff")({
  files: [
    "path/to/file1.css",
    "path/to/file2.scss"
  ],
  omit: [ //optional ability to omit rule types
    "comment"
  ]
  visual: true //defaults to false
}).then(function(diff) {
  console.log(diff.visual);
  console.log(diff.different);
})
```

[1]:http://en.wikipedia.org/wiki/Parse_tree
