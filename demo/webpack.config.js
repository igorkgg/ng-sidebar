const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const root = function (args) {
  return path.join.apply(path, [__dirname].concat(...arguments));
};

module.exports = {
  mode: 'development',

  entry: [
    root('src/polyfills.ts'),
    root('src/bootstrap.ts')
  ],

  output: {
    path: root('dist'),
    filename: 'js/[name].js'
  },

  resolve: {
    modules: [path.join(__dirname, 'node_modules')],
    extensions: ['.js', '.ts', '.scss', '.html']
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: [/node_modules\//],
        loader: 'ts-loader'
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              sourceMap: true
            }
          },
          'sass-loader'
        ]
      }
    ]
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: root('public/index.html'),
      inject: true
    }),

    new MiniCssExtractPlugin({
      filename: 'css/[name].css'
    }),

    new CopyWebpackPlugin({
      patterns: [{
        from: root('public'),
        to: root('dist'),
        globOptions: {
          ignore: ['**/index.html']
        }
      }]
    }),

    new webpack.ContextReplacementPlugin(
      /angular(\\|\/)core(\\|\/)@angular/,
      root('src')
    )
  ],

  devServer: {
    static: {
      directory: root('public')
    },
    port: 8080
  }
};
