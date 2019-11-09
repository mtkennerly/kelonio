module.exports = {
    "reporters": [
        "default",
        "<rootDir>/node_modules/kelonio/out/jestReporter",
    ],
    "transform": {
        "^.+\\.tsx?$": "ts-jest",
    },
    "testMatch": [
        "<rootDir>/*.test.ts",
    ],
    "setupFilesAfterEnv": [
        "<rootDir>/jest.setup.js",
    ],
}
