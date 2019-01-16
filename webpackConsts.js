const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackMd5Hash = require('webpack-md5-hash');

const server = {
    host: '0.0.0.0',
    port: '4000'
};

const frontEntryPoint = {
    js: './front/index.js',
    html: './front/index.html'
};

module.exports.configs = {
    path,
    MiniCssExtractPlugin,
    CleanWebpackPlugin,
    HtmlWebpackPlugin,
    WebpackMd5Hash,
    server,
    frontEntryPoint,
    webpack
};