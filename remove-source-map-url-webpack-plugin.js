const RemoveSourceMapURLWebpackPlugin = function(opts) {};
const regExp = /\/\/# sourceURL=\[module\]\\n\/\/# sourceMappingURL=data:application\/json;charset=utf-8;base64,[^ ]+\\n\/\/# sourceURL=webpack-internal:\/\/\/\d+\\n/g;

RemoveSourceMapURLWebpackPlugin.prototype.onAfterCompile = function(compilation, cb) {
  Object.keys(compilation.assets).forEach((key) => {
    let asset = compilation.assets[key];
    let source = asset.source().replace(regExp, '');
    compilation.assets[key] = Object.assign(asset, {
      source: function () { return source }
    });
  });
  cb();
};

RemoveSourceMapURLWebpackPlugin.prototype.apply = function(compiler) {
  compiler.plugin('after-compile', this.onAfterCompile.bind(this));
};

module.exports = RemoveSourceMapURLWebpackPlugin;
