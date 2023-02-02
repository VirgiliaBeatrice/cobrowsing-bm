const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin');

// https://akabeko.me/blog/2020/12/electron-12/

const renderDevConfig = {
  // モード値を production に設定すると最適化された状態で、
  // development に設定するとソースマップ有効でJSファイルが出力される
  mode: 'development',

  // externals: {
  //   'socket.io-client': 'io'
  // },
  // メインとなるJavaScriptファイル（エントリーポイント）
  entry: {
      renderer: path.join(__dirname, 'src', 'renderer', 'index.ts')
  },
  output: {
      path: path.join(__dirname, 'dist'),
      filename: 'renderer.js'
  },
  target: 'web',
  devtool: 'eval-source-map',
  plugins:[
    new HtmlWebpackPlugin({
      hash: true,
      filename: './index.html'
    })
  ],
  module: {
    rules: [
      {
        // 拡張子 .ts の場合
        test: /\.ts$/,
        // TypeScript をコンパイルする
        use: {
          loader: 'ts-loader',
          options: {
              configFile: 'tsconfig.renderer.dev.json'
          }
        }

      },
      {
        test: /\.css$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {url:false}
          }
        ]
      }
    ],
    // noParse: [ /socket.io-client/ ]
  },
  // import 文で .ts ファイルを解決するため
  // これを定義しないと import 文で拡張子を書く必要が生まれる。
  // フロントエンドの開発では拡張子を省略することが多いので、
  // 記載したほうがトラブルに巻き込まれにくい。
  resolve: {
    // 拡張子を配列で指定
    extensions: [
      '.ts', '.js',
    ],
    modules: ["node_modules"]
    // alias: {
    //   'socket.io-client': path.join( __dirname, 'node_modules', 'socket.io-client', 'socket.io.js' )
    //   }
  },
};

const preloadDevConfig = {
  // モード値を production に設定すると最適化された状態で、
  // development に設定するとソースマップ有効でJSファイルが出力される
  mode: 'development',
  // メインとなるJavaScriptファイル（エントリーポイント）
  entry: {
      preload: path.join(__dirname, 'src', 'preload', 'preload.ts')
  },
  output: {
      path: path.join(__dirname, 'dist'),
      filename: 'preload.js'
  },
  target: 'electron-preload',
  devtool: 'eval-source-map',
  node: {
      __dirname: false,
      __filename: false
  },
  module: {
    rules: [
      {
        // 拡張子 .ts の場合
        test: /\.ts$/,
        // TypeScript をコンパイルする
        use: {
          loader: 'ts-loader',
          options: {
              configFile: 'tsconfig.preload.dev.json'
          }
        }

      },
    ],
  },
};

const mainDevConfig = {
  // モード値を production に設定すると最適化された状態で、
  // development に設定するとソースマップ有効でJSファイルが出力される
  mode: 'development',
  // メインとなるJavaScriptファイル（エントリーポイント）
  entry: {
      preload: path.join(__dirname, 'src', 'main', 'index.ts')
  },
  output: {
      path: path.join(__dirname, 'dist'),
      filename: 'main.js'
  },
  target: 'electron-main',
  devtool: 'eval-source-map',
  module: {
    rules: [
      {
        // 拡張子 .ts の場合
        test: /\.ts$/,
        // TypeScript をコンパイルする
        use: {
          loader: 'ts-loader',
          options: {
              configFile: 'tsconfig.main.dev.json'
          }
        }
      },
    ],
  },
  resolve: {
    extensions: [
      '.ts', '.js',
    ],
  }
}

  //https://socket.io/docs/v4/server-with-bundlers/
module.exports = [ mainDevConfig, renderDevConfig, preloadDevConfig]
