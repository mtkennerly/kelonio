import { benchmark, Benchmark } from ".";
import { FOOTER, HEADER } from "./etc";

const EVENT_TEST_BEGIN = "test";
const EVENT_RUN_END = "end";

interface MochaReporterOptions {
    reporterOptions: {
        inferDescriptions?: boolean;
    };
}

class MochaReporter {
    private activeKelonioBenchmark: Benchmark = benchmark;

    constructor(runner: Mocha.Runner, options: MochaReporterOptions) {
        const inferDescriptions = options.reporterOptions.inferDescriptions;
        if (inferDescriptions === true || inferDescriptions === undefined) {
            runner.on(EVENT_TEST_BEGIN, test => {
                this.activeKelonioBenchmark.baseDescription = test.titlePath();
            });
        }
        runner.once(EVENT_RUN_END, () => {
            const report = this.activeKelonioBenchmark.report();
            console.log(`\n${HEADER}\n${report}\n${FOOTER}`);
        });
    }
}

export = MochaReporter;
