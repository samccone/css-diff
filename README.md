CSS Diff
--------

Compare two CSS files at an AST level.
Useful when you are comparing the output of two versions of a library implemented in different preprocessor libraries.

# Using

## Command Line

The command line interface takes 2 paths to css files as well as an options `-v` or `--visual` argument to print the diff. The return value of the invokation with be `true` or `false`.

* `$ npm install css-diff`
* `$ node_modules/.bin/css-diff path/to/file.css path/to/file2.css -v`

## In your code

* `$ npm install css-diff --save`

```js
require("css-diff")({
  files: [
    "path/to/file1.css",
    "path/to/file2.css"
  ],
  visual: true //defaults to false
}).then(function(diff) {
  console.log(diff.visual);
  console.log(diff.different);
})
```