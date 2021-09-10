module.exports = {
    parser: "@typescript-eslint/parser",
    extends: ["eslint:recommended", "plugin:react/recommended", "plugin:@typescript-eslint/eslint-recommended"],
    plugins: ["@typescript-eslint", "react"],
    env: {
        es6: true,
        node: true,
    },
    globals: {
        Atomics: "readonly",
        SharedArrayBuffer: "readonly",
    },
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: "module",
        ecmaFeatures: {
            jsx: true,
        },
    },

    rules: {
        "no-unused-vars": "off", // next row is relevant
        "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
        "no-var": "error",
        "prefer-const": "error",
    },
};
