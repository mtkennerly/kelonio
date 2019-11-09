import fs from "fs";
import { benchmark, Benchmark } from ".";
import { FOOTER, HEADER, STATE_FILE } from "./etc";

class JestReporter implements jest.Reporter {
    private activeKelonioBenchmark: Benchmark = benchmark;

    static initializeKelonio(): void {
        benchmark.config.serializeData = true;
        try { fs.unlinkSync(STATE_FILE); } catch { }
    }

    onRunComplete(): void {
        if (!fs.existsSync(STATE_FILE)) {
            throw new Error(
                "The Kelonio reporter for Jest requires benchmark serialization."
                + " Make sure to set `benchmark.config.serialize = true` in your Jest setup."
            );
        }

        // We don't have the same Benchmark instance here as the tests do,
        // so we still need to set the config to trigger the right behavior.
        this.activeKelonioBenchmark.config.serializeData = true;

        const report = this.activeKelonioBenchmark.report();
        console.log(`\n${HEADER}\n${report}\n${FOOTER}`);

        fs.unlinkSync(STATE_FILE);
    }
}

export = JestReporter;
