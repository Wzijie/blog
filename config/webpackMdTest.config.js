const paths = require('./paths');
const path = require("path");
const webpack = require("webpack");

const config =  {
  mode: 'development',
  devtool: 'source-map',
  entry: path.resolve(__dirname, '../src/views/Home/index.js'),
  output: {
    path: path.resolve(__dirname, '../dist')
  },
  module: {
    rules: [
      {
        test: /\.md$/,
        include: path.resolve(__dirname, '../src/views/Home/index.md'),
        use: [{
          loader: path.resolve(__dirname, './md-loader/index.js'),
        }],
      }
    ]
  }
}

webpack(config, (err, stats) => {
  if (err || stats.hasErrors()) {
    if (err) {
      console.error(err.stack || err);
      if (err.details) {
        console.error(err.details);
      }
      return;
    }
  
    const info = stats.toJson();
  
    if (stats.hasErrors()) {
      console.error(info.errors);
    }
  
    if (stats.hasWarnings()) {
      console.warn(info.warnings);
    }
  }
  // 处理完成
});
