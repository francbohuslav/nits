module.exports = {
    globals: {
        "ts-jest": {
            tsconfig: "tsconfig.server.json",
        },
    },
    moduleFileExtensions: ["ts", "js"],
    transform: {
        "^.+\\.(ts|tsx)$": "ts-jest",
    },
    testMatch: ["**/tests/**/*.test.ts"],
    testEnvironment: "node",
};
