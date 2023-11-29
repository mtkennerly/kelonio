import hrtime from "browser-hrtime";
import * as mathjs from "mathjs";

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
    beforeEach?: () => any;

    /**
     * Callback to invoke after each iteration.
     */
    afterEach?: () => any;

    /**
     * Whether to make use of the options like `meanUnder` and `minUnder`.
     * @default true
     */
    verify: boolean;
}



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
 * Default options for Benchmark.measure().
 */
export const defaultMeasureOptions: MeasureOptions = {
    iterations: 100,
    serial: true,
    verify: true,
};

/**
 * Measure the time it takes for a function to execute.
 *
 * @param fn - Function to measure.
 * @param options - Options to customize the measurement.
 */
export async function measure(
    fn: () => any,
    options: Partial<MeasureOptions> = {}
): Promise<Measurement> {
    const mergedOptions = { ...defaultMeasureOptions, ...options };
    const durations: Array<number> = [];
    let calls: Array<Function> = [];

    for (let i = 0; i < mergedOptions.iterations; i++) {
        calls.push(async () => {
            if (mergedOptions.beforeEach !== undefined) {
                await maybePromise(mergedOptions.beforeEach);
            }

            const startTime = hrtime();
            await maybePromise(fn);
            const [durationSec, durationNano] = hrtime(startTime);
            durations.push(durationSec * 1e3 + durationNano / 1e6);

            if (mergedOptions.afterEach !== undefined) {
                await maybePromise(mergedOptions.afterEach);
            }
        });
    }

    const measureStart = hrtime();

    if (mergedOptions.serial) {
        for (const call of calls) {
            await call();
        }
    } else {
        await Promise.all(calls.map((x) => x()));
    }

    const [measureSec, measureNano] = hrtime(measureStart);
    const totalDuration = measureSec * 1e3 + measureNano / 1e6;

    const measurement = new Measurement(durations, totalDuration);
    verifyMeasurement(measurement, mergedOptions);
    return measurement;
}

export function verifyMeasurement(
    measurement: Measurement,
    options: MeasureOptions
): void {
    if (!options.verify) {
        return;
    }
    if (options.meanUnder !== undefined) {
        if (measurement.mean > options.meanUnder) {
            throw new PerformanceError(
                `Mean time of ${measurement.mean} ms exceeded threshold of ${options.meanUnder} ms`
            );
        }
    }
    if (options.minUnder !== undefined) {
        if (measurement.min > options.minUnder) {
            throw new PerformanceError(
                `Minimum time of ${measurement.min} ms exceeded threshold of ${options.minUnder} ms`
            );
        }
    }
    if (options.maxUnder !== undefined) {
        if (measurement.max > options.maxUnder) {
            throw new PerformanceError(
                `Maximum time of ${measurement.max} ms exceeded threshold of ${options.maxUnder} ms`
            );
        }
    }
    if (options.marginOfErrorUnder !== undefined) {
        if (measurement.marginOfError > options.marginOfErrorUnder) {
            throw new PerformanceError(
                `Margin of error time of ${measurement.marginOfError} ms exceeded threshold of ${options.marginOfErrorUnder} ms`
            );
        }
    }
    if (options.standardDeviationUnder !== undefined) {
        if (measurement.standardDeviation > options.standardDeviationUnder) {
            throw new PerformanceError(
                `Standard deviation time of ${measurement.standardDeviation} ms exceeded threshold of ${options.standardDeviationUnder} ms`
            );
        }
    }
}


async function maybePromise(fn: () => any): Promise<void> {
    const ret = fn();
    if (ret instanceof Promise) {
        await ret;
    }
}
