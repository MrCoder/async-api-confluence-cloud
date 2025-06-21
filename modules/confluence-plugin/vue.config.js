const SpeedMeasureWebpackPlugin = require('speed-measure-webpack-plugin');
const { ESBuildMinifyPlugin } = require('esbuild-loader')
const { execSync } = require('child_process');

process.env.VUE_APP_GIT_HASH = execSync('git rev-parse --short HEAD').toString().trim()
process.env.VUE_APP_GIT_BRANCH = execSync('git branch --show-current').toString().trim()
process.env.VUE_APP_GIT_TAG = execSync('git describe --tags --always --abbrev=0').toString().trim()
console.log(`Building ${process.env.VUE_APP_GIT_TAG} (${process.env.VUE_APP_GIT_HASH}) on ${process.env.VUE_APP_GIT_BRANCH}`)

module.exports = {
  publicPath: '/confluence-plugin',
  pages: {
    "index": {
      entry: 'src/main.ts',
      template: 'public/index.html',
      chunks: ['chunk-common', 'chunk-index-vendors', 'index']
    },
    "asyncapi-viewer": {
      entry: 'src/asyncapi-viewer.ts',
      template: 'public/asyncapi-viewer.html',
      chunks: ['chunk-common', 'chunk-asyncapi-viewer-vendors', 'asyncapi-viewer']
    },
    "asyncapi-editor": {
      entry: 'src/asyncapi-editor.ts',
      template: 'public/asyncapi-editor.html',
      chunks: ['chunk-common', 'chunk-asyncapi-editor-vendors', 'asyncapi-editor']
    },
    "embed-viewer": {
      entry: 'src/embed-viewer.ts',
      template: 'public/embed-viewer.html',
      chunks: ['chunk-common', 'chunk-embed-viewer-vendors', 'embed-viewer']
    },
    "embed-editor": {
      entry: 'src/embed-editor.ts',
      template: 'public/embed-editor.html',
      chunks: ['chunk-common', 'chunk-embed-editor-vendors', 'embed-editor']
    }
  },
  chainWebpack: config => {
    // Use esbuild for JavaScript/TypeScript transpilation
    const rule = config.module.rule('js');
    rule.uses.clear()
    rule.use('esbuild-loader').loader('esbuild-loader').options({
      target: 'es2022',
      format: 'esm'
    });

    const ruleTs = config.module.rule('ts');
    ruleTs.uses.clear()
    ruleTs.use('esbuild-loader').loader('esbuild-loader').options({
      loader: 'ts',
      target: 'es2022',
      format: 'esm',
      tsconfigRaw: require('./tsconfig.json')
    });

    // Remove terser and use esbuild for minification
    config.optimization.minimizers.delete('terser');
    config.optimization
      .minimizer('esbuild')
      .use(ESBuildMinifyPlugin, [{ 
        target: 'es2022',
        minify: true, 
        css: true,
        legalComments: 'none'
      }]);

    // Optimize chunk splitting for Node.js 22
    const options = module.exports
    const pages = options.pages
    const pageKeys = Object.keys(pages)
    const IS_VENDOR = /[\\/]node_modules[\\/]/
    
    config.optimization
      .splitChunks({
        cacheGroups: {
          vendors: {
            name: 'chunk-vendors',
            priority: -10,
            chunks: 'initial',
            minChunks: 1,
            test: IS_VENDOR,
            reuseExistingChunk: false,
            enforce: true,
          },
          ...pageKeys.map((key) => ({
            name: `chunk-${key}-vendors`,
            priority: -1,
            chunks: (chunk) => chunk.name === key,
            minChunks: 1,
            test: IS_VENDOR,
            reuseExistingChunk: false,
            enforce: true,
          })),
          common: {
            name: 'chunk-common',
            priority: -20,
            chunks: 'initial',
            minChunks: 2,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      });
  },
  productionSourceMap: false,
  configureWebpack: {
    plugins: [
      new SpeedMeasureWebpackPlugin(),
    ],
    output: {
      chunkFormat: 'array-push'
    },
    resolve: {
      fallback: {
        "stream": false,
        "crypto": require.resolve("crypto-browserify"),
        "buffer": require.resolve("buffer")
      },
      alias: {
        // Keep existing aliases
      }
    },
    // Node.js 22 specific optimizations
    experiments: {
      topLevelAwait: true
    }
  },
  devServer: {
    historyApiFallback: true,
    hot: true,
    host: '0.0.0.0',
    port: 8080,
    client: {
      webSocketURL: 'auto://0.0.0.0:0/ws',
    },
    proxy: {
      // Keep existing proxy configuration
    },
    compress: true,
    onBeforeSetupMiddleware: function (devServer) {
      devServer.app.post(/installed/, function (req, res) {
        res.status(200).send(`OK`);
      })
      devServer.app.post(/uninstalled/, function (req, res) {
        res.status(200).send(`OK`);
      })
      devServer.app.get(/attachment/, function (req, res) {
        res.send(`<ac:image> <ri:attachment ri:filename="zenuml-${req.query.uuid}.png" /> </ac:image>`);
      })
    },
    allowedHosts: "all",
  }
};