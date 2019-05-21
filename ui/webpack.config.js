/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WorkboxWebpackPlugin = require('workbox-webpack-plugin');

module.exports = {
  entry: ['babel-polyfill', './dist/my-app.js'],
  devServer: {
    historyApiFallback: true
  },
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          plugins: ['@babel/plugin-syntax-dynamic-import'],
          presets: [
            [
              '@babel/preset-env',
              {
                useBuiltIns: 'usage',
                targets: '>1%, not dead, not ie 11'
              }
            ]
          ]
        }
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin([
      'images/**',
      'node_modules/@webcomponents/webcomponentsjs/**',
      'node_modules/@holochain/**',
      'node_modules/lit-element/**'
    ]),
    new HtmlWebpackPlugin({
      chunksSortMode: 'none',
      template: 'index.html'
    })
    /*  
    ,
   new WorkboxWebpackPlugin.InjectManifest({
      include: ['index.html', 'manifest.json', /\.js$/],
      exclude: [/\/@webcomponents\/webcomponentsjs\//],
      swSrc: './service-worker.js',
      swDest: 'service-worker.js'
    })
 */
  ]
};
