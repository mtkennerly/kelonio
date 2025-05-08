import hrtime from "browser-hrtime";
import { EventEmitter } from "eventemitter3";
import * as mathjs from "mathjs";
import { FOOTER, HEADER } from "./reporters/utils";

export declare interface BenchmarkEventEmitter {
    emit(event: "record", description: Array<string>, measurement: Measurement): boolean;
    on(event: "record", listener: (description: Array<string>, measurement: Measurement) => void): this;
    once(event: "record", listener: (description: Array<string>, measurement: Measurement) => void): this;
}

export class BenchmarkEventEmitter extends EventEmitter<"record"> { }

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
     * Optional name of the measurement, for use in reporting.
     */
    description: Array<string> = [];

    /**
     * Total duration of the benchmark, i.e. for throughput.
     * This includes time spent on any configured `beforeEach`/`afterEach` callbacks.
     * When `serial` is false, this number will be lower.
     */
    totalDuration: number;

    /**
     *
     * @param durations - Durations measured, in milliseconds.
     *     The list must not be empty.
     * @param totalDuration - Duration of the entire measurement, in milliseconds.
     */
    constructor(public durations: Array<number>, totalDuration?: number) {
        if (durations.length === 0) {
            throw new Error("The list of durations must not be empty");
        }
        this.totalDuration = totalDuration ?? mathjs.sum(durations);
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
        return mathjs.std(...this.durations);
    }

    /**
     * Margin of error at 95% confidence level, in milliseconds.
     */
    get marginOfError(): number {
        return mathjs.sqrt(mathjs.variance(...this.durations) / this.durations.length) * 1.96;
    }
}

/**
 * Options for Benchmark.measure().
 */
export interface MeasureOptions<BeforeEachReturnType = any, FunctionReturnType = any> {
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
     * If the margin of error at 95% confidence level exceeds this many milliseconds,
     * throw a [[PerformanceError]].
     */
    marginOfErrorUnder?: number;

    /**
     * If the standard deviation of all durations measured exceeds this many milliseconds,
     * throw a [[PerformanceError]].
     */
    standardDeviationUnder?: number;

    /**
     * Callback to invoke before each iteration.
     */
    beforeEach?: () => BeforeEachReturnType;

    /**
     * Callback to invoke after each iteration.
     */
    afterEach?: (beforeEachValue: Awaited<BeforeEachReturnType>, functionValue: Awaited<FunctionReturnType>) => any;

    /**
     * Whether to make use of the options like `meanUnder` and `minUnder`.
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
         * Total duration of the benchmark, i.e. for throughput.
         * This is nullable for compatibility with older serialized data from the Jest reporter.
         */
        totalDuration?: number;

        /**
         * Nested test data, such as when passing `["A", "B"]` as the
         * description to [[Benchmark.record]].
         */
        children: BenchmarkData,
    };
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
export async function measure<BeforeEachReturnType = any, FunctionReturnType = any>(
    fn: (beforeEachValue: Awaited<BeforeEachReturnType>) => FunctionReturnType,
    options: Partial<MeasureOptions<BeforeEachReturnType, FunctionReturnType>> = {}
): Promise<Measurement> {
    const mergedOptions = { ...defaultMeasureOptions, ...options };
    const durations: Array<number> = [];
    let calls: Array<Function> = [];

    for (let i = 0; i < mergedOptions.iterations; i++) {
        calls.push(async () => {
            let beforeEachValue: BeforeEachReturnType | undefined = undefined;
            if (mergedOptions.beforeEach !== undefined) {
                beforeEachValue = await mergedOptions.beforeEach();
            }

            const startTime = hrtime();
            const functionValue = await fn(beforeEachValue as Awaited<BeforeEachReturnType>);
            const [durationSec, durationNano] = hrtime(startTime);
            durations.push(durationSec * 1e3 + durationNano / 1e6);

            if (mergedOptions.afterEach !== undefined) {
                await mergedOptions.afterEach(beforeEachValue as Awaited<BeforeEachReturnType>, functionValue as Awaited<FunctionReturnType>);
            }
        });
    }

    const measureStart = hrtime();

    if (mergedOptions.serial) {
        for (const call of calls) {
            await call();
        }
    } else {
        await Promise.all(calls.map(x => x()));
    }

    const [measureSec, measureNano] = hrtime(measureStart);
    const totalDuration = measureSec * 1e3 + measureNano / 1e6;

    const measurement = new Measurement(durations, totalDuration);
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
    if (options.marginOfErrorUnder !== undefined) {
        if (measurement.marginOfError > options.marginOfErrorUnder) {
            throw new PerformanceError(`Margin of error time of ${measurement.marginOfError} ms exceeded threshold of ${options.marginOfErrorUnder} ms`);
        }
    }
    if (options.standardDeviationUnder !== undefined) {
        if (measurement.standardDeviation > options.standardDeviationUnder) {
            throw new PerformanceError(`Standard deviation time of ${measurement.standardDeviation} ms exceeded threshold of ${options.standardDeviationUnder} ms`);
        }
    }
}

/**
 * Used for filtering benchmark data.
 */
export enum Criteria {
    Fastest,
    Slowest,
}

/**
 * Aggregator for performance results of various tests.
 */
export class Benchmark {
    /**
     * Raw data collected from [[Benchmark.record]].
     */
    data: BenchmarkData = {};

    /**
     * Event emitter.
     *
     * * `record` is emitted after [[Benchmark.record]] finishes all iterations.
     *
     * Refer to [[BenchmarkEventEmitter.on]] for the event callback signatures.
     */
    events: BenchmarkEventEmitter = new BenchmarkEventEmitter();

    /**
     * Measure the time it takes for a function to execute.
     * In addition to returning the measurement itself, this method also
     * stores the result in [[Benchmark.data]] for later use/reporting.
     *
     * With this overload, since no description is provided, the data will not
     * be recorded directly. However, a `record` event will still be emitted,
     * allowing any listeners (such as reporters) to act on it.
     *
     * @param fn - Function to measure. If it returns a promise,
     *     then it will be `await`ed automatically as part of the iteration.
     * @param options - Options to customize the measurement.
     */
    async record(fn: () => any, options?: Partial<Omit<MeasureOptions, "verify">>): Promise<Measurement>;
    /**
     * Measure the time it takes for a function to execute.
     * In addition to returning the measurement itself, this method also
     * stores the result in [[Benchmark.data]] for later use/reporting,
     * and [[Benchmark.events]] emits a `record` event for any listeners.
     *
     * @param description - Name of what is being tested.
     *     This can be a series of names for nested categories.
     *     Must not be empty.
     * @param fn - Function to measure. If it returns a promise,
     *     then it will be `await`ed automatically as part of the iteration.
     * @param options - Options to customize the measurement.
     */
    async record(description: string | Array<string>, fn: () => any, options?: Partial<Omit<MeasureOptions, "verify">>): Promise<Measurement>;
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

        if ((descriptionSpecified && description.length === 0)) {
            throw new Error("The description must not be empty");
        }
        if (typeof description === "string") {
            description = [description];
        }

        const measurement = await measure(fn, { ...mergedOptions, verify: false });

        if (description.length > 0) {
            this.incorporate(description, measurement);
        }
        this.events.emit("record", description, measurement);
        verifyMeasurement(measurement, { ...mergedOptions, verify: true });
        return measurement;
    }

    /**
     * Add a measurement directly to [[Benchmark.data]].
     *
     * @param description - Name of what is being tested.
     *     Must not be empty.
     * @param measurement - Measurement to add to the benchmark data.
     */
    incorporate(description: Array<string>, measurement: Measurement): void {
        if ((description.length === 0)) {
            throw new Error("The description must not be empty");
        }
        this.addBenchmarkDurations(this.data, description, measurement.durations, measurement.totalDuration);
    }

    private addBenchmarkDurations(data: BenchmarkData, categories: Array<string>, durations: Array<number>, totalDuration: number): void {
        if (!(categories[0] in data)) {
            data[categories[0]] = { durations: [], children: {}, totalDuration: 0 };
        }

        if (categories.length === 1) {
            data[categories[0]].durations = data[categories[0]].durations.concat(durations);
            data[categories[0]].totalDuration = (data[categories[0]].totalDuration ?? 0) + totalDuration;
        } else {
            this.addBenchmarkDurations(data[categories[0]].children, categories.slice(1), durations, totalDuration);
        }
    }

    private reportLevel(level: BenchmarkData, depth: number): Array<string> {
        let lines: Array<string> = [];
        for (const [description, info] of Object.entries(level)) {
            const showMeasurement = info.durations.length > 0;
            const showChildren = Object.keys(info.children).length > 0;
            lines.push(`${"  ".repeat(depth)}${description}:`);
            if (showMeasurement) {
                const measurement = new Measurement(info.durations, info.totalDuration);
                const mean = round(measurement.mean);
                const moe = round(measurement.marginOfError);
                const iterations = measurement.durations.length;
                const totalDuration = round(measurement.totalDuration);
                lines.push(`${"  ".repeat(depth + 1)}${mean} ms (+/- ${moe} ms) from ${iterations} iterations (${totalDuration} ms total)`);
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
        const lines = this.reportLevel(this.data, 0);
        if (lines.length === 0) {
            return "";
        } else {
            return [HEADER, ...lines, FOOTER].join("\n");
        }
    }

    private getMeasurementsAtLevel(level: BenchmarkData, descriptions: Array<string>): Array<Measurement> {
        let measurements: Array<Measurement> = [];
        for (const [description, info] of Object.entries(level)) {
            const localDescriptions = [...descriptions, description];
            if (info.durations.length > 0) {
                const measurement = new Measurement(info.durations, info.totalDuration);
                measurement.description = localDescriptions;
                measurements.push(measurement);
            }
            measurements = measurements.concat(this.getMeasurementsAtLevel(info.children, localDescriptions));
        }
        return measurements;
    }

    /**
     * Get a list of [[Measurement]] based on [[Benchmark.data]].
     */
    get measurements(): Array<Measurement> {
        return this.getMeasurementsAtLevel(this.data, []);
    }

    /**
     * Find the measurement that meets some criteria.
     * In the case of a tie, the first one found wins.
     *
     * @param criteria - Criteria by which to select a measurement.
     * @param value - Callback to select a specific field of each measurement for comparison.
     *     The default uses the mean plus the margin of error.
     * @returns the matching measurement, or null if no measurements have been taken
     */
    find(criteria: Criteria, value: (m: Measurement) => number = m => m.mean + m.marginOfError): Measurement | null {
        let candidate = null;
        for (const measurement of this.measurements) {
            if (candidate === null) {
                candidate = measurement;
            } else if (criteria === Criteria.Fastest && value(measurement) < value(candidate)) {
                candidate = measurement;
            } else if (criteria === Criteria.Slowest && value(measurement) > value(candidate)) {
                candidate = measurement;
            }
        }
        return candidate;
    }
}

/**
 * Default [[Benchmark]] instance for shared usage throughout your tests.
 * Each instance stores its own state from measurement results, so if you
 * want to avoid global state, you can create additional instances as well.
 */
export const benchmark = new Benchmark();
