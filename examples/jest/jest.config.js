module.exports = {
    "reporters": [
        "default",
        ["<rootDir>/node_modules/kelonio/out/plugin/jestReporter", {keepState: false}]
    ],
    "transform": {
        "^.+\\.tsx?$": "ts-jest",
    },
    "testMatch": [
        "<rootDir>/*.test.ts",
    ],
    "setupFilesAfterEnv": [
        "<rootDir>/node_modules/kelonio/out/plugin/jestReporterSetup.js",
    ],
}
