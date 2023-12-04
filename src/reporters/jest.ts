import * as fs from "fs";
import { Benchmark, benchmark } from '../index'
import { ExtensionLookup, handleExtraReports } from "./utils";

export const STATE_FILE = ".kelonio.state.json";

export class BenchmarkFileState {
    exists(): boolean {
        return fs.existsSync(STATE_FILE);
    }

    read(): any {
        return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
    }

    write(data: object): void {
        fs.writeFileSync(STATE_FILE, JSON.stringify(data), "utf-8");
    }

    append(data: object): void {
        let previousData;
        try {
            previousData = this.read();
        } catch {
            previousData = {};
        }
        this.write({ ...previousData, ...data });
    }

    delete(): void {
        try {
            fs.unlinkSync(STATE_FILE);
        } catch {}
    }
}

interface JestReporterOptions {
    keepStateAtStart?: boolean;
    keepStateAtEnd?: boolean;
    printReportAtEnd?: boolean;
    extensions?: Array<ExtensionLookup>;
}

export class JestReporter implements jest.Reporter {
    options: JestReporterOptions = {
        keepStateAtStart: false,
        keepStateAtEnd: false,
        printReportAtEnd: true,
    };
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
                "The Kelonio reporter for Jest requires benchmark serialization." +
                    " Make sure to call `JestReporter.initializeKelonio()`."
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
