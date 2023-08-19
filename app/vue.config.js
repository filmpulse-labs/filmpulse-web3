const webpack = require('webpack')
const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
    transpileDependencies: true,
    devServer: {
            allowedHosts: 'all',
           client: {
                webSocketURL: 'auto://0.0.0.0:0/ws'
         }
        },
    configureWebpack: {
        plugins: [
            new webpack.ProvidePlugin({
                Buffer: ['buffer', 'Buffer']
            })
        ],
        resolve: {
            fallback: {
                crypto: require.resolve("crypto-browserify"),
                fs: false,
                assert: false,
                process: false,
                util: false,
                path: false,
                stream: require.resolve("stream-browserify"),
            }
        }
    }
})
