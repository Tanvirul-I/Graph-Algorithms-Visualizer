const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const isProd = process.env.NODE_ENV === "production";
const PROJECT_BASE = process.env.PROJECT_BASE || "/Graph-Algorithms-Visualizer/";

module.exports = {
	mode: isProd ? "production" : "development",
	entry: "./src/index.tsx",
	output: {
		filename: isProd ? "assets/[name].[contenthash].js" : "assets/[name].js",
		path: path.resolve(__dirname, "dist"),
		clean: true,
		publicPath: isProd ? PROJECT_BASE : "/"
	},
	resolve: {
		extensions: [".tsx", ".ts", ".js"]
	},
	module: {
		rules: [
			{ test: /\.tsx?$/, use: "ts-loader", exclude: /node_modules/ },
			{ test: /\.css$/, use: ["style-loader", "css-loader"] },
			{ test: /\.(png|jpe?g|gif|svg|webp|ico)$/i, type: "asset" },
			{ test: /\.(woff2?|ttf|eot)$/, type: "asset/resource" }
		]
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: "public/index.html"
		})
	],
	devServer: {
		static: { directory: path.join(__dirname, "dist") },
		historyApiFallback: true,
		compress: true,
		port: 9003,
		open: true
	}
};
