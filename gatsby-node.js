const webpack = require('webpack');

exports.onCreateWebpackConfig = ({ stage, actions }) => {
    actions.setWebpackConfig({
        resolve: { 
            fallback: { 
                "assert": require.resolve("assert/") ,
                "http": require.resolve("stream-http"),
                "os": require.resolve("os-browserify/browser"),
                "https": require.resolve("https-browserify"),
                "stream": require.resolve("stream-browserify"),
                "buffer": require.resolve("buffer"),
                "path": require.resolve("path-browserify"),
                "crypto": require.resolve("crypto-browserify"),
                "tls": require.resolve("tls-browserify"),
                "net": require.resolve("net-browserify"),
                "zlib": require.resolve("zlib-browserify"),
                "fs": require.resolve("browserify-fs"),
                "https": require.resolve("https-browserify"),
            } 
        },
        plugins: [
            new webpack.ProvidePlugin({
                process: 'process/browser',
                Buffer: ['buffer', 'Buffer'],
            })
        ],
    })
  }