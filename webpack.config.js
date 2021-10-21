const path = require("path"),
    CopyPlugin = require("copy-webpack-plugin"),
    HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    mode: "development",
    entry: {
        web: ["./src/web/index.tsx"],
        vendor: ["react", "react-dom"],
    },
    output: {
        path: path.resolve(__dirname, "dist/web"),
        filename: "[name].bundle.js",
    },
    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",

    module: {
        rules: [
            {
                test: /\.ts(x?)$/,
                use: [
                    {
                        loader: "ts-loader",
                        options: {
                            configFile: "tsconfig.web.json",
                        },
                    },
                ],
            },
            {
                test: /\.(le|c)ss$/,
                use: [
                    { loader: "style-loader" },
                    { loader: "css-loader" },
                    {
                        loader: "less-loader",
                        options: {
                            sourceMap: true,
                        },
                    },
                ],
            },
            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            {
                enforce: "pre",
                test: /\.js$/,
                loader: "source-map-loader",
            },
        ],
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "src", "web", "index.html"),
            favicon: path.resolve(__dirname, "src", "web", "images", "favicon.png"),
            hash: true,
        }),
        new CopyPlugin({
            patterns: [
                { from: "src/web/images", to: "images" },
                { from: "src/web/privacy-policy.html", to: "privacy-policy.html" },
            ],
        }),
    ],

    // When importing a module whose path matches one of the following, just
    // assume a corresponding global variable exists and use that instead.
    // This is important because it allows us to avoid bundling all of our
    // dependencies, which allows browsers to cache those libraries between builds.
    externals: {
        react: "React",
        "react-dom": "ReactDOM",
    },
};
