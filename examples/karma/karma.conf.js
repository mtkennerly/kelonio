module.exports = config => {
    config.set({
        frameworks: ["jasmine", "browserify"],
        files: [
            "node_modules/kelonio/out/plugin/karmaReporterSetup.js",
            "*.test.js"
        ],
        preprocessors: {
            "node_modules/kelonio/out/plugin/karmaReporterSetup.js": ["browserify"],
            "*.test.js": ["browserify"],
        },
        plugins: [
            "kelonio/out/plugin/karmaReporter",
            "karma-chrome-launcher",
            "karma-jasmine",
            "karma-browserify",
            "karma-spec-reporter",
        ],
        reporters: ["spec", "kelonio"],
        browsers: ["Chrome"],
        singleRun: true,
        browserConsoleLogOptions: {
            terminal: false,
        },
        kelonioReporter: {
            inferBrowsers: true,
        },
    });
};
