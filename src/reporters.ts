import { benchmark, Benchmark, Measurement } from ".";
import { BenchmarkFileState } from "./etc";

const MOCHA_EVENT_TEST_BEGIN = "test";
const MOCHA_EVENT_RUN_END = "end";
type KarmaLoggedRecord = { description: Array<string>, durations: Array<number> };

interface MochaReporterOptions {
    reporterOptions: {
        inferDescriptions?: boolean;
    };
}

interface KarmaReporterOptions {
    inferBrowsers?: boolean;
}

interface JestReporterOptions {
    keepStateAtEnd?: boolean;
    printReportAtEnd?: boolean;
}
export class JestReporter implements jest.Reporter {
    options: JestReporterOptions = { keepStateAtEnd: false, printReportAtEnd: true };
    constructor(testData?: any, options?: JestReporterOptions) {
        if (options) {
            this.options = { ...this.options, ...options };
        }
    }
    static initializeKelonio(): void {
        const state = new BenchmarkFileState();
        state.write({});
        benchmark.events.on("record", (description, measurement) => {
            const b = new Benchmark();
            if (state.exists()) {
                b.data = state.read();
            }
            b.incorporate(description, measurement);
            state.write(b.data);
        });
    }

    onRunComplete(): void {
        const state = new BenchmarkFileState();
        if (!state.exists()) {
            throw new Error(
                "The Kelonio reporter for Jest requires benchmark serialization."
                + " Make sure to call `JestReporter.initializeKelonio()`."
            );
        }

        const b = new Benchmark();
        b.data = state.read();

        if (this.options.printReportAtEnd) {
            console.log(`\n${b.report()}`);
        }

        if (!this.options.keepStateAtEnd) {
            state.delete();
        }
    }
}

export class KarmaReporter {
    protected onBrowserLog: (browser: string, log: string, type: string) => void;
    protected onRunComplete: () => void;

    static initializeKelonio(): void {
        benchmark.events.on("record", (description, measurement) => {
            (<any>window).__karma__.log("kelonio", [JSON.stringify({ description, durations: measurement.durations })]);
        });
    }

    constructor(baseReporterDecorator: any, config: { kelonioReporter?: KarmaReporterOptions }, logger: unknown, helper: unknown, formatError: unknown) {
        baseReporterDecorator(this);
        const activeConfig = { ...{ inferBrowsers: true }, ...config.kelonioReporter };
        const b = new Benchmark();

        this.onBrowserLog = (browser: string, log: string, type: string) => {
            if (type === "kelonio") {
                const parsed: KarmaLoggedRecord = JSON.parse(log.slice(1, -1));
                const browserDescription = activeConfig.inferBrowsers ? [browser] : [];
                b.incorporate([...browserDescription, ...parsed.description], new Measurement(parsed.durations));
            }
        };

        this.onRunComplete = () => {
            (<any>this).write(`${b.report()}\n`);
        };
    }
}

export class MochaReporter {
    constructor(runner: Mocha.Runner, options: MochaReporterOptions) {
        const b = new Benchmark();
        let baseDescription: Array<string> = [];
        const inferDescriptions = options.reporterOptions.inferDescriptions;

        benchmark.events.on("record", (description, measurement) => {
            b.incorporate(baseDescription.concat(description), measurement);
        });
        if (inferDescriptions === true || inferDescriptions === undefined) {
            runner.on(MOCHA_EVENT_TEST_BEGIN, test => {
                baseDescription = test.titlePath();
            });
        }
        runner.once(MOCHA_EVENT_RUN_END, () => {
            console.log(`\n${b.report()}`);
        });
    }
}
