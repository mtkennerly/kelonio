import fs from "fs";
import * as mathjs from "mathjs";
import { STATE_FILE } from "./etc";
import JestReporter from "./jestReporter";
import MochaReporter from "./MochaReporter";

export { JestReporter, MochaReporter };

/**
 * Base error for benchmark failures, such as a function taking too long
 * to execute.
 */
export class PerformanceError extends Error {
    constructor(message?: string) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

/**
 * Performance measurement result from running a benchmark.
 */
export class Measurement {
    /**
     *
     * @param durations - Durations measured, in milliseconds.
     *     The list must not be empty.
     */
    constructor(public durations: Array<number>) {
        if (durations.length === 0) {
            throw new Error("The list of durations must not be empty");
        }
    }

    /**
     * Mean of all durations measured, in milliseconds.
     */
    get mean(): number {
        return mathjs.mean(this.durations);
    }

    /**
     * Minimum duration measured, in milliseconds.
     */
    get min(): number {
        return mathjs.min(this.durations);
    }

    /**
     * Maximum duration measured, in milliseconds.
     */
    get max(): number {
        return mathjs.max(this.durations);
    }

    /**
     * Standard deviation of all durations measured, in milliseconds.
     */
    get standardDeviation(): number {
        return mathjs.std(this.durations);
    }

    /**
     * Margin of error at 95% confidence level, in milliseconds.
     */
    get marginOfError(): number {
        return mathjs.sqrt(mathjs.variance(this.durations) / this.durations.length) * 1.96;
    }
}

/**
 * Options for Benchmark.measure().
 */
export interface MeasureOptions {
    /**
     * The number of times to call the function and measure its duration.
     * @default 100
     */
    iterations: number;

    /**
     * Whether to wait for each iteration to finish before starting the next.
     * @default true
     */
    serial: boolean;

    /**
     * If the mean measured duration exceeds this many milliseconds,
     * throw a [[PerformanceError]].
     */
    meanUnder?: number;

    /**
     * If the minimum measured duration exceeds this many milliseconds,
     * throw a [[PerformanceError]].
     */
    minUnder?: number;

    /**
    * If the maximum measured duration exceeds this many milliseconds,
    * throw a [[PerformanceError]].
    */
    maxUnder?: number;

    /**
     * Callback to invoke before each iteration.
     */
    beforeEach?: () => any;

    /**
     * Callback to invoke after each iteration.
     */
    afterEach?: () => any;

    /**
     * Whether to make use of the meanUnder/minUnder/maxUnder options.
     * @default true
     */
    verify: boolean;
}

/**
 * Default options for Benchmark.measure().
 */
const defaultMeasureOptions: MeasureOptions = {
    iterations: 100,
    serial: true,
    verify: true,
};

/**
 * Raw data collected from [[Benchmark.record]].
 */
export interface BenchmarkData {
    /**
     * Description passed to [[Benchmark.record]].
     */
    [description: string]: {
        /**
         * Durations of all measured iterations, in milliseconds.
         */
        durations: Array<number>,

        /**
         * Nested test data, such as when passing `["A", "B"]` as the
         * description to [[Benchmark.record]].
         */
        children: BenchmarkData,
    };
}

/**
 * Options for customizing [[Benchmark]] behavior.
 */
export interface BenchmarkConfig {
    /**
     * Whether to write the performance data to a file (`.kelonio.state.json`)
     * during tests and then use it for reporting at the end of the test run.
     * This is mainly needed for test frameworks where the reporting phase
     * runs in an isolated context from the tests themselves.
     * @default false
     */
    serializeData: boolean;
}

async function maybePromise(fn: () => any): Promise<void> {
    const ret = fn();
    if (ret instanceof Promise) {
        await ret;
    }
}

function round(value: number, places: number = 5): number {
    return mathjs.round(value, places) as number;
}

/**
 * Measure the time it takes for a function to execute.
 *
 * @param fn - Function to measure.
 * @param options - Options to customize the measurement.
 */
export async function measure(fn: () => any, options: Partial<MeasureOptions> = {}): Promise<Measurement> {
    const mergedOptions = { ...defaultMeasureOptions, ...options };
    const durations: Array<number> = [];
    let calls: Array<Function> = [];

    for (let i = 0; i < mergedOptions.iterations; i++) {
        calls.push(async () => {
            if (mergedOptions.beforeEach !== undefined) {
                await maybePromise(mergedOptions.beforeEach);
            }

            const startTime = process.hrtime();
            await maybePromise(fn);
            const [durationSec, durationNano] = process.hrtime(startTime);
            durations.push(durationSec * 1e3 + durationNano / 1e6);

            if (mergedOptions.afterEach !== undefined) {
                await maybePromise(mergedOptions.afterEach);
            }
        });
    }

    if (mergedOptions.serial) {
        for (const call of calls) {
            await call();
        }
    } else {
        await Promise.all(calls.map(x => x()));
    }

    const measurement = new Measurement(durations);
    verifyMeasurement(measurement, mergedOptions);
    return measurement;
}

function verifyMeasurement(measurement: Measurement, options: MeasureOptions): void {
    if (!options.verify) {
        return;
    }
    if (options.meanUnder !== undefined) {
        if (measurement.mean > options.meanUnder) {
            throw new PerformanceError(`Mean time of ${measurement.mean} ms exceeded threshold of ${options.meanUnder} ms`);
        }
    }
    if (options.minUnder !== undefined) {
        if (measurement.min > options.minUnder) {
            throw new PerformanceError(`Minimum time of ${measurement.min} ms exceeded threshold of ${options.minUnder} ms`);
        }
    }
    if (options.maxUnder !== undefined) {
        if (measurement.max > options.maxUnder) {
            throw new PerformanceError(`Maximum time of ${measurement.max} ms exceeded threshold of ${options.maxUnder} ms`);
        }
    }
}

/**
 * Aggregator for performance results of various tests.
 */
export class Benchmark {
    data: BenchmarkData = {};
    config: BenchmarkConfig;
    baseDescription: Array<string> = [];

    constructor() {
        this.config = {
            serializeData: false,
        };
    }

    /**
     * Measure the time it takes for a function to execute.
     * In addition to returning the measurement itself, this method also
     * stores the result in [[Benchmark.data]] for later use/reporting.
     *
     * With this overload, the function will try to get the description from
     * [[Benchmark.baseDescription]]. If that is empty, then this function
     * will throw.
     *
     * @param fn - Function to measure. If it returns a promise,
     *     then it will be `await`ed automatically as part of the iteration.
     * @param options - Options to customize the measurement.
     *     Note that `verify` will be overridden to `true`.
     */
    async record(fn: () => any, options?: Partial<MeasureOptions>): Promise<Measurement>;
    /**
     * Measure the time it takes for a function to execute.
     * In addition to returning the measurement itself, this method also
     * stores the result in [[Benchmark.data]] for later use/reporting.
     *
     * @param description - Name of what is being tested.
     *     This can be a series of names for nested categories.
     *     Must not be empty, unless [[Benchmark.baseDescription]] is set.
     *     If both are set, then they will be concatenated.
     * @param fn - Function to measure. If it returns a promise,
     *     then it will be `await`ed automatically as part of the iteration.
     * @param options - Options to customize the measurement.
     *     Note that `verify` will be overridden to `true`.
     */
    async record(description: string | Array<string>, fn: () => any, options?: Partial<MeasureOptions>): Promise<Measurement>;
    async record(a: any, b: any, c?: any): Promise<Measurement> {
        let description: string | Array<string>;
        let descriptionSpecified = false;
        let fn: () => any;
        let options: Partial<MeasureOptions>;

        if (typeof a === "function") {
            description = [];
            fn = a;
            options = b || {};
        } else {
            description = a;
            descriptionSpecified = true;
            fn = b;
            options = c || {};
        }

        const mergedOptions = { ...defaultMeasureOptions, ...options };

        if ((descriptionSpecified && description.length === 0) || (!descriptionSpecified && this.baseDescription.length === 0)) {
            throw new Error("The description must not be empty");
        } else if (typeof description === "string") {
            description = [description];
        }
        description = this.baseDescription.concat(description);

        const measurement = await measure(fn, { ...mergedOptions, verify: false });

        this.addBenchmarkDurations(this.data, description, measurement.durations);
        if (this.config.serializeData) {
            let data: BenchmarkData = this.data;
            if (fs.existsSync(STATE_FILE)) {
                data = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
                this.addBenchmarkDurations(data, description, measurement.durations);
            }
            fs.writeFileSync("./.kelonio.state.json", JSON.stringify(data), "utf-8");
        }

        verifyMeasurement(measurement, { ...mergedOptions, verify: true });
        return measurement;
    }

    private addBenchmarkDurations(data: BenchmarkData, categories: Array<string>, durations: Array<number>): void {
        if (!(categories[0] in data)) {
            data[categories[0]] = { durations: [], children: {} };
        }

        if (categories.length === 1) {
            data[categories[0]].durations = data[categories[0]].durations.concat(durations);
        } else {
            this.addBenchmarkDurations(data[categories[0]].children, categories.slice(1), durations);
        }
    }

    private reportLevel(level: BenchmarkData, depth: number): Array<string> {
        let lines: Array<string> = [];
        for (const [description, info] of Object.entries(level)) {
            const showMeasurement = info.durations.length > 0;
            const showChildren = Object.keys(info.children).length > 0;
            lines.push(`${"  ".repeat(depth)}${description}:`);
            if (showMeasurement) {
                const measurement = new Measurement(info.durations);
                const mean = round(measurement.mean);
                const moe = round(measurement.marginOfError);
                const iterations = measurement.durations.length;
                lines.push(`${"  ".repeat(depth + 1)}${mean} ms (+/- ${moe} ms) from ${iterations} iterations`);
            }
            if (showMeasurement && showChildren) {
                lines.push("");
            }
            if (showChildren) {
                lines = lines.concat(this.reportLevel(info.children, depth + 1));
            }
        }
        return lines;
    }

    /**
     * Create a report of all the benchmark results.
     */
    report(): string {
        let data: BenchmarkData = this.data;
        if (this.config.serializeData && fs.existsSync(STATE_FILE)) {
            data = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
        }
        return this.reportLevel(data, 0).join("\n");
    }
}

/**
 * Default [[Benchmark]] instance for shared usage throughout your tests.
 * Each instance stores its own state from measurement results, so if you
 * want to avoid global state, you can create additional instances as well.
 */
export const benchmark = new Benchmark();
