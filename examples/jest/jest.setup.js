const { benchmark, JestReporter } = require("kelonio");

benchmark.config.serializeData = true;
JestReporter.initializeKelonio();
