import { benchmark, Benchmark, Measurement } from "..";
import { ExtensionLookup, handleExtraReports } from "./utils";

type KarmaLoggedRecord = { description: Array<string>, durations: Array<number>, totalDuration: number };

interface KarmaReporterOptions {
    inferBrowsers?: boolean;
    printReportAtEnd?: boolean;
    extensions?: Array<ExtensionLookup>;
}

export class KarmaReporter {
    protected onBrowserLog: (
        browser: string,
        log: string,
        type: string
    ) => void;
    protected onRunComplete: () => void;

    static initializeKelonio(): void {
        benchmark.events.on("record", (description, measurement) => {
            (<any>window).__karma__.log("kelonio", [
                JSON.stringify({
                    description,
                    durations: measurement.durations,
                    totalDuration: measurement.totalDuration,
                }),
            ]);
        });
    }

    constructor(
        baseReporterDecorator: any,
        config: { kelonioReporter?: KarmaReporterOptions },
        logger: unknown,
        helper: unknown,
        formatError: unknown
    ) {
        baseReporterDecorator(this);
        const activeConfig = {
            ...{ inferBrowsers: true, printReportAtEnd: true },
            ...config.kelonioReporter,
        };
        const b = new Benchmark();

        this.onBrowserLog = (browser: string, log: string, type: string) => {
            if (type === "kelonio") {
                const parsed: KarmaLoggedRecord = JSON.parse(log.slice(1, -1));
                const browserDescription = activeConfig.inferBrowsers
                    ? [browser]
                    : [];
                b.incorporate(
                    [...browserDescription, ...parsed.description],
                    new Measurement(parsed.durations, parsed.totalDuration)
                );
            }
        };

        this.onRunComplete = () => {
            if (activeConfig.printReportAtEnd) {
                (<any>this).write(`${b.report()}\n`);
                handleExtraReports(activeConfig.extensions, b, (msg) =>
                    (<any>this).write(`${msg}\n`)
                );
            }
        };
    }
}
