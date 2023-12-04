import { Benchmark, benchmark } from "..";
import { ExtensionLookup, handleExtraReports } from "./utils";

const MOCHA_EVENT_TEST_BEGIN = "test";
const MOCHA_EVENT_RUN_END = "end";

interface MochaReporterOptions {
    reporterOptions: {
        inferDescriptions?: boolean;
        printReportAtEnd?: boolean;
        extensions?: Array<ExtensionLookup>;
    };
}

export class MochaReporter {
    constructor(runner: Mocha.Runner, options: MochaReporterOptions) {
        const b = new Benchmark();
        let baseDescription: Array<string> = [];
        const inferDescriptions =
            options.reporterOptions.inferDescriptions ?? true;
        const printReportAtEnd =
            options.reporterOptions.printReportAtEnd ?? true;
        const extensions = options.reporterOptions.extensions ?? [];

        benchmark.events.on("record", (description, measurement) => {
            b.incorporate(baseDescription.concat(description), measurement);
        });
        if (inferDescriptions) {
            runner.on(MOCHA_EVENT_TEST_BEGIN, (test) => {
                baseDescription = test.titlePath();
            });
        }
        runner.once(MOCHA_EVENT_RUN_END, () => {
            if (printReportAtEnd) {
                console.log(`\n${b.report()}`);
                handleExtraReports(extensions, b, console.log);
            }
        });
    }
}
