import fs from "fs";
import stripIndent from "strip-indent";
import { Benchmark, measure, Measurement, PerformanceError } from "../src";
import { STATE_FILE } from "../src/etc";

// Using `await util.promisify(setTimeout)(500)` leads to this error in some tests:
// "Async callback was not invoked within the 5000ms timeout"
const sleep = async (ms: number) => new Promise((resolve, reject) => { setTimeout(resolve, ms); });

const description = "foo";

function normalize(text: string): string {
    return stripIndent(text).trim();
}

describe("measure", () => {
    it("passes if the function runs fine", async () => {
        const measurement = await measure(() => { });
        expect(measurement.durations).toHaveLength(100);
    });

    it("supports asynchronous execution", async () => {
        const measurement = await measure(() => { }, { serial: false });
        expect(measurement.durations).toHaveLength(100);
    });

    it("supports a custom number of iterations", async () => {
        const measurement = await measure(() => { }, { iterations: 50 });
        expect(measurement.durations).toHaveLength(50);
    });

    it("fails if the callback throws (serial)", async () => {
        const error = new Error("foo");
        await expect(measure(() => { throw error; })).rejects.toThrow(error);
    });

    it("fails if the callback throws (non-serial)", async () => {
        const error = new Error("foo");
        await expect(measure(() => { throw error; }, { serial: false })).rejects.toThrow(error);
    });

    it("passes if meanUnder is satisfied", async () => {
        await measure(async () => await sleep(100), { meanUnder: 150, iterations: 1 });
    });

    it("fails if meanUnder is exceeded", async () => {
        await expect(
            measure(async () => await sleep(100), { meanUnder: 50, iterations: 1 })
        ).rejects.toThrow(PerformanceError);
    });

    it("passes if minUnder is satisfied", async () => {
        await measure(async () => await sleep(100), { minUnder: 150, iterations: 1 });
    });

    it("fails if minUnder is exceeded", async () => {
        await expect(
            measure(async () => await sleep(100), { minUnder: 50, iterations: 1 })
        ).rejects.toThrow(PerformanceError);
    });

    it("passes if maxUnder is satisfied", async () => {
        await measure(async () => await sleep(100), { maxUnder: 150, iterations: 1 });
    });

    it("fails if maxUnder is exceeded", async () => {
        await expect(
            measure(async () => await sleep(100), { maxUnder: 50, iterations: 1 })
        ).rejects.toThrow(PerformanceError);
    });

    it("supports a beforeEach callback", async () => {
        let count = 0;
        await measure(() => { }, { beforeEach: () => count++ });
        expect(count).toBe(100);
    });

    it("supports an afterEach callback", async () => {
        let count = 0;
        await measure(() => { }, { afterEach: () => count++ });
        expect(count).toBe(100);
    });
});

describe("Measurement", () => {
    let measurement: Measurement;

    beforeEach(() => {
        measurement = new Measurement([1, 4, 10]);
    });

    it("rejects an empty list of durations", () => {
        expect(() => new Measurement([])).toThrow();
    });

    it("calculates the mean duration", () => {
        expect(measurement.mean).toBe(5);
    });

    it("calculates the minimum duration", () => {
        expect(measurement.min).toBe(1);
    });

    it("calculates the maximum duration", () => {
        expect(measurement.max).toBe(10);
    });

    it("calculates the standard deviation", () => {
        expect(measurement.standardDeviation).toBe(4.58257569495584);
    });

    it("calculates the margin of error", () => {
        expect(measurement.marginOfError).toBe(5.185672569686598);
    });
});

describe("Benchmark", () => {
    let benchmark: Benchmark;

    beforeEach(() => {
        benchmark = new Benchmark();
    });

    describe("record", () => {
        it("passes if the function runs fine", async () => {
            const measurement = await benchmark.record(description, () => { });
            expect(benchmark.data).toHaveProperty("foo");
            expect(measurement.durations).toHaveLength(100);
        });

        it("fails if a threshold is exceeded, but still records results", async () => {
            await expect(
                benchmark.record(description, async () => await sleep(100), { meanUnder: 50, iterations: 3 })
            ).rejects.toThrow(PerformanceError);
            expect(benchmark.data[description].durations).toHaveLength(3);
        });

        it("allows omitting the description if baseDescription is set", async () => {
            benchmark.baseDescription = ["bar"];
            await benchmark.record(() => { });
            expect(benchmark.data.bar.durations).toHaveLength(100);
        });

        it("does not allow omitting the description if baseDescription is not set", async () => {
            await expect(
                benchmark.record(() => { })
            ).rejects.toThrow(new Error("The description must not be empty"));
        });

        it("handles options when no description is provided", async () => {
            benchmark.baseDescription = ["bar"];
            await expect(
                benchmark.record(async () => await sleep(100), { meanUnder: 50, iterations: 3 })
            ).rejects.toThrow(PerformanceError);
            expect(benchmark.data.bar.durations).toHaveLength(3);
        });

        it("supports multiple descriptions", async () => {
            const measurement = await benchmark.record(["foo", "bar"], () => { });
            expect(benchmark.data).toHaveProperty("foo");
            expect(benchmark.data.foo.children).toHaveProperty("bar");
            expect(measurement.durations).toHaveLength(100);
        });

        it("combines results for the same description", async () => {
            await benchmark.record(description, () => { });
            await benchmark.record(description, () => { });
            expect(benchmark.data.foo.durations).toHaveLength(200);
        });

        it.each([
            ["string", ""],
            ["array", []],
        ])("rejects an empty %s description", async (...args) => {
            await expect(
                benchmark.record(args[1], async () => await sleep(100))
            ).rejects.toThrow(new Error("The description must not be empty"));
        });

        it.each([
            ["string", ""],
            ["array", []],
        ])("rejects an empty %s description even when baseDescription is set", async (...args) => {
            benchmark.baseDescription = ["bar"];
            await expect(
                benchmark.record(args[1], async () => await sleep(100))
            ).rejects.toThrow(new Error("The description must not be empty"));
        });

        it("handles serialization when the record file does not already exist", async () => {
            try { fs.unlinkSync(STATE_FILE); } catch { }

            benchmark.config.serializeData = true;
            await benchmark.record(description, () => { });

            expect(fs.existsSync(STATE_FILE)).toBeTruthy();
            const serialized = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
            expect(serialized.foo).toEqual(benchmark.data.foo);
        });

        it("handles serialization when the record file already exists", async () => {
            const bar = { durations: [1, 2, 3], children: {} };
            try { fs.unlinkSync(STATE_FILE); } catch { }
            fs.writeFileSync(STATE_FILE, JSON.stringify({ bar }), "utf-8");

            benchmark.config.serializeData = true;
            await benchmark.record(description, () => { });

            expect(fs.existsSync(STATE_FILE)).toBeTruthy();
            const serialized = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
            expect(serialized.foo).toEqual(benchmark.data.foo);
            expect(serialized.bar).toEqual(bar);
        });
    });

    describe("report", () => {
        it("outputs an empty string when there is no data", () => {
            expect(benchmark.report()).toBe("");
        });

        it("handles a single level of data with one record", () => {
            benchmark.data = {
                foo: {
                    durations: [1, 2, 3, 4],
                    children: {},
                }
            };
            expect(benchmark.report()).toBe(normalize(`
                foo:
                  2.5 ms (+/- 1.26517 ms) from 4 iterations
            `));
        });

        it("handles a single level of data with multiple records", () => {
            benchmark.data = {
                foo: {
                    durations: [1],
                    children: {},
                },
                bar: {
                    durations: [2],
                    children: {},
                }
            };
            expect(benchmark.report()).toBe(normalize(`
                foo:
                  1 ms (+/- 0 ms) from 1 iterations
                bar:
                  2 ms (+/- 0 ms) from 1 iterations
            `));
        });

        it("handles multiple levels of data", () => {
            benchmark.data = {
                foo: {
                    durations: [1],
                    children: {
                        bar: {
                            durations: [2],
                            children: {},
                        }
                    },
                }
            };
            expect(benchmark.report()).toBe(normalize(`
                foo:
                  1 ms (+/- 0 ms) from 1 iterations

                  bar:
                    2 ms (+/- 0 ms) from 1 iterations
            `));
        });

        it("handles multiple levels of data when one level has no durations", () => {
            benchmark.data = {
                foo: {
                    durations: [],
                    children: {
                        bar: {
                            durations: [2],
                            children: {},
                        }
                    },
                }
            };
            expect(benchmark.report()).toBe(normalize(`
                foo:
                  bar:
                    2 ms (+/- 0 ms) from 1 iterations
            `));
        });
    });
});
