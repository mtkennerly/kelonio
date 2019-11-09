import { EventEmitter } from "events";
import stripIndent from "strip-indent";
import { Benchmark, MochaReporter } from "../src";

function makeReporter(reporterOptions: any = {}): [EventEmitter, Benchmark] {
    const runner = new EventEmitter();
    const reporter = new MochaReporter(<any>runner, { reporterOptions });
    const benchmark = new Benchmark();
    // @ts-ignore
    reporter.activeKelonioBenchmark = benchmark;
    return [runner, benchmark];
}

afterEach(() => {
    jest.restoreAllMocks();
});

describe("MochaReporter", () => {
    it("automatically adds test names as the base description", async () => {
        const [runner, benchmark] = makeReporter();

        runner.emit("test", { titlePath: () => ["A", "B"] });
        expect(benchmark.baseDescription).toEqual(["A", "B"]);
        await benchmark.record(() => { });
        expect(benchmark.data.A.children.B.durations).toHaveLength(100);

        runner.emit("test", { titlePath: () => ["A", "B"] });
        await benchmark.record("C", () => { });
        expect(benchmark.data.A.children.B.children.C.durations).toHaveLength(100);
    });

    it("does not infer descriptions when disabled", async () => {
        const [runner, benchmark] = makeReporter({ inferDescriptions: false });

        runner.emit("test", { titlePath: () => ["A", "B"] });
        expect(benchmark.baseDescription).toEqual([]);
        await benchmark.record("C", () => { });
        expect(Object.keys(benchmark.data)).toEqual(["C"]);
        expect(benchmark.data.C.durations).toHaveLength(100);
    });

    it("prints a report after the test run ends", () => {
        const [runner, benchmark] = makeReporter();

        const spy = jest.spyOn(console, "log");
        benchmark.data = {
            foo: {
                durations: [1, 2, 3],
                children: {},
            }
        };

        runner.emit("end");

        expect(spy.mock.calls[0][0]).toBe(stripIndent(`
            - - - - - - - - - - - - - - - - - Performance - - - - - - - - - - - - - - - - -
            foo:
              2 ms (+/- 1.13161 ms) from 3 iterations
            - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        `).trimRight());
    });
});
