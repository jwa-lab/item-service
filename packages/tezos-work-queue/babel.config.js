// Babel is only used to compile the jest tests!

module.exports = {
    presets: [
        ["@babel/preset-env", { targets: { node: "current" } }],
        "@babel/preset-typescript"
    ]
};
