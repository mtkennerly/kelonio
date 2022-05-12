module.exports = {
    "reporters": [
        "default",
        [
            "<rootDir>/node_modules/kelonio/out/plugin/jestReporter",
            {
                keepStateAtStart: false,
                keepStateAtEnd: false,
                printReportAtEnd: true,
                extraReports: [
                    { module: `${__dirname}/kelonioExtra.js`, callback: "extraReport" },
                ],
            },
        ],
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
