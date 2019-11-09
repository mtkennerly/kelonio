module.exports = {
    "collectCoverageFrom": [
        "src/*.ts",
    ],
    "coverageReporters": [
        "html",
        "text",
    ],
    "reporters": [
        "default",
    ],
    "transform": {
        "^.+\\.tsx?$": "ts-jest",
    },
    "testMatch": [
        "<rootDir>/tests/*.test.ts",
    ],
}
