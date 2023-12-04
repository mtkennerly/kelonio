import stripIndent from "strip-indent";
import { Benchmark, Criteria, measure, Measurement, PerformanceError } from "../src";
import { FOOTER, HEADER } from "../src/reporters/utils";

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

        it("does not record data when no description is provided", async () => {
            await benchmark.record(() => { });
            expect(Object.keys(benchmark.data)).toEqual([]);
        });

        it("handles options when no description is provided", async () => {
            await expect(
                benchmark.record(async () => await sleep(100), { meanUnder: 50, iterations: 3 })
            ).rejects.toThrow(PerformanceError);
            expect(Object.keys(benchmark.data)).toEqual([]);
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

        it("emits a `record` event without a description", async done => {
            benchmark.events.on("record", (description, measurement) => {
                expect(description).toEqual([]);
                expect(measurement.durations).toHaveLength(100);
                done();
            });
            await benchmark.record(() => { });
        });

        it("emits a `record` event with a description", async done => {
            benchmark.events.on("record", (description, measurement) => {
                expect(description).toEqual(["foo"]);
                expect(measurement.durations).toHaveLength(100);
                done();
            });
            await benchmark.record("foo", () => { });
        });
    });

    describe("incorporate", () => {
        it("adds data to the benchmark", () => {
            benchmark.incorporate(["foo"], new Measurement([1, 2, 3]));
            expect(benchmark.data.foo.durations).toEqual([1, 2, 3]);
        });

        it("rejects an empty description", () => {
            expect(
                () => benchmark.incorporate([], new Measurement([1, 2, 3]))
            ).toThrow(new Error("The description must not be empty"));
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
                    totalDuration: 101,
                    children: {},
                }
            };
            expect(benchmark.report()).toBe(normalize(`
                - - - - - - - - - - - - - - - - - Performance - - - - - - - - - - - - - - - - -
                foo:
                  2.5 ms (+/- 1.26517 ms) from 4 iterations (101 ms total)
                - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            `));
        });

        it("handles a single level of data with multiple records", () => {
            benchmark.data = {
                foo: {
                    durations: [1],
                    totalDuration: 101,
                    children: {},
                },
                bar: {
                    durations: [2],
                    totalDuration: 102,
                    children: {},
                }
            };
            expect(benchmark.report()).toBe(normalize(`
                ${HEADER}
                foo:
                  1 ms (+/- 0 ms) from 1 iterations (101 ms total)
                bar:
                  2 ms (+/- 0 ms) from 1 iterations (102 ms total)
                ${FOOTER}
            `));
        });

        it("handles multiple levels of data", () => {
            benchmark.data = {
                foo: {
                    durations: [1],
                    totalDuration: 101,
                    children: {
                        bar: {
                            durations: [2],
                            totalDuration: 102,
                            children: {},
                        }
                    },
                }
            };
            expect(benchmark.report()).toBe(normalize(`
                ${HEADER}
                foo:
                  1 ms (+/- 0 ms) from 1 iterations (101 ms total)

                  bar:
                    2 ms (+/- 0 ms) from 1 iterations (102 ms total)
                ${FOOTER}
            `));
        });

        it("handles multiple levels of data when one level has no durations", () => {
            benchmark.data = {
                foo: {
                    durations: [],
                    totalDuration: 0,
                    children: {
                        bar: {
                            durations: [2],
                            totalDuration: 102,
                            children: {},
                        }
                    },
                }
            };
            expect(benchmark.report()).toBe(normalize(`
                ${HEADER}
                foo:
                  bar:
                    2 ms (+/- 0 ms) from 1 iterations (102 ms total)
                ${FOOTER}
            `));
        });
    });

    describe("measurements", () => {
        it("converts data with one level", () => {
            benchmark.data = {
                foo: { durations: [1], totalDuration: 101, children: {} },
                bar: { durations: [2], totalDuration: 102, children: {} },
            };
            expect(benchmark.measurements).toEqual([
                (() => { const m = new Measurement([1], 101); m.description = ["foo"]; return m; })(),
                (() => { const m = new Measurement([2], 102); m.description = ["bar"]; return m; })(),
            ]);
        });

        it("converts data with nested levels", () => {
            benchmark.data = {
                foo: {
                    durations: [],
                    totalDuration: 0,
                    children: {
                        bar: {
                            durations: [1], totalDuration: 101, children: {}
                        },
                    }
                },
            };
            expect(benchmark.measurements).toEqual([
                (() => { const m = new Measurement([1], 101); m.description = ["foo", "bar"]; return m; })(),
            ]);
        });

        it("handles empty data", () => {
            expect(benchmark.measurements).toHaveLength(0);
        });
    });

    describe("find", () => {
        it("can find the fastest by the default field", async () => {
            benchmark.data = {
                foo: { durations: [1, 2], totalDuration: 101, children: {} },
                bar: { durations: [1.1, 1.2], totalDuration: 102, children: {} },
            };
            const result = benchmark.find(Criteria.Fastest);
            expect(result?.description).toEqual(["bar"]);
            expect(result?.durations).toEqual([1.1, 1.2]);
        });

        it("can find the fastest by a custom field", async () => {
            benchmark.data = {
                foo: { durations: [1, 2], totalDuration: 101, children: {} },
                bar: { durations: [1.1, 1.2], totalDuration: 102, children: {} },
            };
            const result = benchmark.find(Criteria.Fastest, m => m.min);
            expect(result?.description).toEqual(["foo"]);
        });

        it("can find the slowest by the default field", async () => {
            benchmark.data = {
                foo: { durations: [1, 2], totalDuration: 101, children: {} },
                bar: { durations: [0.1, 0.1, 2.1], totalDuration: 102, children: {} },
            };
            const result = benchmark.find(Criteria.Slowest);
            expect(result?.description).toEqual(["foo"]);
        });

        it("can find the slowest by a custom field", async () => {
            benchmark.data = {
                foo: { durations: [1, 2], totalDuration: 101, children: {} },
                bar: { durations: [0.1, 0.1, 2.1], totalDuration: 102, children: {} },
            };
            const result = benchmark.find(Criteria.Slowest, m => m.max);
            expect(result?.description).toEqual(["bar"]);
        });

        it("returns the measurement when there is only one", async () => {
            benchmark.data = {
                foo: { durations: [1, 2], totalDuration: 101, children: {} },
            };
            const result = benchmark.find(Criteria.Fastest);
            expect(result?.description).toEqual(["foo"]);
        });

        it("returns null when there are no measurements", async () => {
            const result = benchmark.find(Criteria.Fastest);
            expect(result).toBeNull();
        });
    });
});
