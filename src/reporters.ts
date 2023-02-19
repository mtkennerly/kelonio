import { benchmark, Benchmark, Measurement } from ".";
import { BenchmarkFileState } from "./etc";

const MOCHA_EVENT_TEST_BEGIN = "test";
const MOCHA_EVENT_RUN_END = "end";
type KarmaLoggedRecord = { description: Array<string>, durations: Array<number>, totalDuration: number };
type Extension = {
    extraReport?: (benchmark: Benchmark) => string | void;
};
type ExtensionLookup = { module: string, extension: string };

interface MochaReporterOptions {
    reporterOptions: {
        inferDescriptions?: boolean;
        printReportAtEnd?: boolean;
        extensions?: Array<ExtensionLookup>;
    };
}

interface KarmaReporterOptions {
    inferBrowsers?: boolean;
    printReportAtEnd?: boolean;
    extensions?: Array<ExtensionLookup>;
}

interface JestReporterOptions {
    keepStateAtStart?: boolean;
    keepStateAtEnd?: boolean;
    printReportAtEnd?: boolean;
    extensions?: Array<ExtensionLookup>;
}

function handleExtraReports(lookups: Array<ExtensionLookup> | undefined, benchmark: Benchmark, print: (report: string) => void): void {
    for (const lookup of (lookups ?? [])) {
        const extension: Extension | undefined = require(lookup.module)?.[lookup.extension];
        const report = extension?.extraReport?.(benchmark);
        if (report) {
            print(report);
        }
    }
}

export class JestReporter implements jest.Reporter {
    options: JestReporterOptions = { keepStateAtStart: false, keepStateAtEnd: false, printReportAtEnd: true };
    constructor(testData?: any, options?: JestReporterOptions) {
        if (options) {
            this.options = { ...this.options, ...options };
        }
    }
    static initializeKelonio(): void {
        const state = new BenchmarkFileState();
        benchmark.events.on("record", (description, measurement) => {
            const b = new Benchmark();
            if (state.exists()) {
                b.data = state.read();
            }
            b.incorporate(description, measurement);
            state.write(b.data);
        });
    }

    onRunStart(): void {
        const state = new BenchmarkFileState();
        if (this.options.keepStateAtStart) {
            state.append({});
        } else {
            state.write({});
        }
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
            handleExtraReports(this.options.extensions, b, console.log);
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
            (<any>window).__karma__.log("kelonio", [JSON.stringify({ description, durations: measurement.durations, totalDuration: measurement.totalDuration })]);
        });
    }

    constructor(baseReporterDecorator: any, config: { kelonioReporter?: KarmaReporterOptions }, logger: unknown, helper: unknown, formatError: unknown) {
        baseReporterDecorator(this);
        const activeConfig = { ...{ inferBrowsers: true, printReportAtEnd: true }, ...config.kelonioReporter };
        const b = new Benchmark();

        this.onBrowserLog = (browser: string, log: string, type: string) => {
            if (type === "kelonio") {
                const parsed: KarmaLoggedRecord = JSON.parse(log.slice(1, -1));
                const browserDescription = activeConfig.inferBrowsers ? [browser] : [];
                b.incorporate([...browserDescription, ...parsed.description], new Measurement(parsed.durations, parsed.totalDuration));
            }
        };

        this.onRunComplete = () => {
            if (activeConfig.printReportAtEnd) {
                (<any>this).write(`${b.report()}\n`);
                handleExtraReports(activeConfig.extensions, b, msg => (<any>this).write(`${msg}\n`));
            }
        };
    }
}

export class MochaReporter {
    constructor(runner: Mocha.Runner, options: MochaReporterOptions) {
        const b = new Benchmark();
        let baseDescription: Array<string> = [];
        const inferDescriptions = options.reporterOptions.inferDescriptions ?? true;
        const printReportAtEnd = options.reporterOptions.printReportAtEnd ?? true;
        const extensions = options.reporterOptions.extensions ?? [];

        benchmark.events.on("record", (description, measurement) => {
            b.incorporate(baseDescription.concat(description), measurement);
        });
        if (inferDescriptions) {
            runner.on(MOCHA_EVENT_TEST_BEGIN, test => {
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
