const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: "./src/index.js",
  output: {
    path: path.join(__dirname, "/"),
    filename: "prod/js/bundle.js",
    publicPath: "/",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ["babel-loader"],
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/index.html",
      filename: "./prod/index.html",
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve("./src/assets/"),
          to: "prod/assets/",
          noErrorOnMissing: true,
        },
        {
          from: path.resolve("./src/styles/"),
          to: "prod/styles/",
          noErrorOnMissing: true,
        },
      ],
    }),
  ],
  devServer: {
    static: path.join(__dirname, "prod"),
    compress: true,
    //Dist and asset should match else you need to enable below writetodisk to sync
    //This creates some junk in folder so im disabling it now
    devMiddleware: {
      writeToDisk: true,
    },

    //host: "0.0.0.0",
    //firewall: false, //disableHostCheck,allowdHosts is replaced by firewall
    port: 3000,
    historyApiFallback: true, // resolves error while refresh or access directly
    // from browser. Error GET /someroot
    proxy: {
      "/": {
        // target: "http://localhost:3015",
        secure: false,
      },
    },
  },
};
