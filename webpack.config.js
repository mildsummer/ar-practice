const webpack = require('webpack');
const path = require('path');
const RemoveSourceMapUrlWebpackPlugin = require('./remove-source-map-url-webpack-plugin.js');
const LicenseInfoWebpackPlugin = require('license-info-webpack-plugin').default;
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = (env, argv) => {
  const PROD = argv.mode === 'production';
  const printedCommentRegExp = /webpackChunkName/;
  return {
    mode: PROD ? 'production' : 'development',
    entry: {
      app: [
        './src/javascripts/entry.js'
      ]
    },
    output: {
      path: path.resolve(__dirname, 'dist/assets'),
      publicPath: '/assets/',
      filename: '[name].js',
      sourceMapFilename: '[name].js.map'
    },
    devServer: {
      contentBase: './dist',
      hot: true,
      host: '192.168.11.6'
    },
    module: {
      rules: [
        {
          enforce: 'pre',
          test: /\.js$/,
          exclude: /node_modules/,
          use: [
            { loader: 'eslint-loader' }
          ]
        },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: [{
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
              shouldPrintComment: PROD ? (value) => (value.match(printedCommentRegExp)) : () => (true)
            }
          }]
        },
        {
          enforce: 'pre',
          test: /\.(sass|scss|css)$/,
          use: [
            { loader: 'import-glob-loader' }
          ]
        },
        {
          test: /\.(sass|scss|css)$/,
          use: [
            'style-loader',
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                plugins: (loader) => [
                  require('iconfont-webpack-plugin')({
                    resolve: loader.resolve
                  }),
                  require('autoprefixer')({ grid: true })
                ]
              }
            },
            {
              loader: 'sass-loader',
              options: {
                outputStyle: PROD ? 'compressed' : 'expanded',
                sourceMap: false
              }
            }
          ]
        }
      ]
    },
    resolve: {
      extensions: ['.js', '.jsx', '.sass', '.scss', '.css']
    },
    optimization: PROD ? {
      minimizer: [
        new UglifyJsPlugin({
          uglifyOptions: {
            output: {
              comments: /author:|url:/
            }
          }
        })
      ]
    } : {},
    node: {
      fs: 'empty'
    },
    plugins: PROD ? [
      new RemoveSourceMapUrlWebpackPlugin({}),
      new LicenseInfoWebpackPlugin({
        glob: '{LICENSE,license,License}*'
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': '"production"'
      }),
      new webpack.optimize.OccurrenceOrderPlugin(), // コンパイルするファイルの順番を調整
      new webpack.ProgressPlugin((percentage, msg) => {
        process.stdout.write('progress ' + Math.floor(percentage * 100) + '% ' + msg + '\r');
      })
    ] : [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': '"development"'
      }),
      new webpack.optimize.OccurrenceOrderPlugin(),
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NoEmitOnErrorsPlugin()
    ]
  };
};
