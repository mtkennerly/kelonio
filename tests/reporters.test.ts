import { EventEmitter } from "events";
import fs from "fs";
import stripIndent from "strip-indent";
import { benchmark, JestReporter, KarmaReporter, Measurement, MochaReporter } from "../src";
import { FOOTER, HEADER, STATE_FILE } from "../src/etc";

function makeMochaReporter(reporterOptions: any = {}): [EventEmitter, MochaReporter] {
    const runner = new EventEmitter();
    const reporter = new MochaReporter(<any>runner, { reporterOptions });
    return [runner, reporter];
}

function makeKarmaReporter(reporterOptions: any = {}): [any, KarmaReporter] {
    const writer = jest.fn();
    const reporter = new KarmaReporter(
        (self: any) => { self.write = writer; },
        reporterOptions,
        undefined,
        undefined,
        undefined,
    );
    return [writer, reporter];
}

afterEach(() => {
    jest.restoreAllMocks();
    benchmark.events.removeAllListeners();
});

describe("JestReporter", () => {
    let reporter: JestReporter;

    beforeEach(() => {
        reporter = new JestReporter();
        try { fs.unlinkSync(STATE_FILE); } catch { }
    });

    describe("initializeKelonio", () => {
        it("sets the state file to an empty object if it exists", () => {
            fs.writeFileSync(STATE_FILE, JSON.stringify({
                foo: {
                    durations: [1, 2, 3],
                    children: {},
                }
            }));
            JestReporter.initializeKelonio();
            expect(fs.existsSync(STATE_FILE)).toBeTruthy();

            const serialized = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
            expect(serialized).toEqual({});
        });

        it("sets the state file to an empty object if the state file is nonexistent", () => {
            JestReporter.initializeKelonio();
            expect(fs.existsSync(STATE_FILE)).toBeTruthy();

            const serialized = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
            expect(serialized).toEqual({});
        });

        it("registers a record callback that serializes data", async () => {
            JestReporter.initializeKelonio();
            await benchmark.record("foo", () => { });
            expect(fs.existsSync(STATE_FILE)).toBeTruthy();
            const serialized = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
            expect(serialized.foo.durations).toHaveLength(100);
        });
    });

    describe("onRunComplete", () => {
        it("requires the record file to exist", () => {
            expect(() => reporter.onRunComplete()).toThrow();
        });

        it("prints a report and deletes the record file", () => {
            const spy = jest.spyOn(console, "log");
            fs.writeFileSync(STATE_FILE, JSON.stringify({
                foo: {
                    durations: [1, 2, 3],
                    children: {},
                }
            }));

            reporter.onRunComplete();

            expect(spy.mock.calls[0][0]).toBe(stripIndent(`
                ${HEADER}
                foo:
                  2 ms (+/- 1.13161 ms) from 3 iterations
                ${FOOTER}
            `).trimRight());
            expect(fs.existsSync(STATE_FILE)).toBeFalsy();
        });

        it("aggregates results from multiple updates to the record file", () => {
            JestReporter.initializeKelonio();
            const spy = jest.spyOn(console, "log");
            fs.writeFileSync(STATE_FILE, JSON.stringify({
                foo: {
                    durations: [1, 2, 3],
                    children: {},
                }
            }));
            benchmark.events.emit("record", ["bar"], new Measurement([4, 5, 6]));

            reporter.onRunComplete();

            expect(spy.mock.calls[0][0]).toBe(stripIndent(`
                ${HEADER}
                foo:
                  2 ms (+/- 1.13161 ms) from 3 iterations
                bar:
                  5 ms (+/- 1.13161 ms) from 3 iterations
                ${FOOTER}
            `).trimRight());
            expect(fs.existsSync(STATE_FILE)).toBeFalsy();
        });

        describe("options", () => {
            it("respects keepStateAtEnd = true", () => {
                JestReporter.initializeKelonio();
                const reporter = new JestReporter({}, {keepStateAtEnd: true});
                const spy = jest.spyOn(console, "log");
                fs.writeFileSync(STATE_FILE, JSON.stringify({
                    foo: {
                        durations: [1, 2, 3],
                        children: {},
                    }
                }));
                benchmark.events.emit("record", ["bar"], new Measurement([4, 5, 6]));

                reporter.onRunComplete();

                expect(spy.mock.calls[0][0]).toBe(stripIndent(`
                    ${HEADER}
                    foo:
                      2 ms (+/- 1.13161 ms) from 3 iterations
                    bar:
                      5 ms (+/- 1.13161 ms) from 3 iterations
                    ${FOOTER}
                `).trimRight());
                expect(fs.existsSync(STATE_FILE)).toBeTruthy();
            });

            it("respects keepStateAtEnd = false", () => {
                JestReporter.initializeKelonio();
                const reporter = new JestReporter({}, {keepStateAtEnd: false});
                const spy = jest.spyOn(console, "log");
                fs.writeFileSync(STATE_FILE, JSON.stringify({
                    foo: {
                        durations: [1, 2, 3],
                        children: {},
                    }
                }));
                benchmark.events.emit("record", ["bar"], new Measurement([4, 5, 6]));

                reporter.onRunComplete();

                expect(spy.mock.calls[0][0]).toBe(stripIndent(`
                    ${HEADER}
                    foo:
                      2 ms (+/- 1.13161 ms) from 3 iterations
                    bar:
                      5 ms (+/- 1.13161 ms) from 3 iterations
                    ${FOOTER}
                `).trimRight());
                expect(fs.existsSync(STATE_FILE)).toBeFalsy();
            });

            it("respects printReportAtEnd = true", () => {
                JestReporter.initializeKelonio();
                const reporter = new JestReporter({}, {printReportAtEnd: true});
                const spy = jest.spyOn(console, "log");
                fs.writeFileSync(STATE_FILE, JSON.stringify({
                    foo: {
                        durations: [1, 2, 3],
                        children: {},
                    }
                }));
                benchmark.events.emit("record", ["bar"], new Measurement([4, 5, 6]));

                reporter.onRunComplete();

                expect(spy.mock.calls[0][0]).toBe(stripIndent(`
                    ${HEADER}
                    foo:
                      2 ms (+/- 1.13161 ms) from 3 iterations
                    bar:
                      5 ms (+/- 1.13161 ms) from 3 iterations
                    ${FOOTER}
                `).trimRight());
            });

            it("respects printReportAtEnd = false", () => {
                JestReporter.initializeKelonio();
                const reporter = new JestReporter({}, {printReportAtEnd: false});
                const spy = jest.spyOn(console, "log");
                fs.writeFileSync(STATE_FILE, JSON.stringify({
                    foo: {
                        durations: [1, 2, 3],
                        children: {},
                    }
                }));
                benchmark.events.emit("record", ["bar"], new Measurement([4, 5, 6]));

                reporter.onRunComplete();

                expect(spy.mock.calls).toEqual([]);
            });
        });
    });
});

describe("KarmaReporter", () => {
    let reporter: KarmaReporter;
    let writer: any;

    beforeEach(() => {
        [writer, reporter] = makeKarmaReporter({});
    });

    it("prints an empty report if no data is received", () => {
        // @ts-ignore
        reporter.onRunComplete();
        expect(writer.mock.calls[0][0]).toBe("\n");
    });

    it("reports on data received from the browser and infers the browser name by default", () => {
        // @ts-ignore
        reporter.onBrowserLog("any", `'{"description":["foo"],"durations":[1,2,3]}'`, "kelonio");
        // @ts-ignore
        reporter.onRunComplete();
        expect(writer.mock.calls[0][0]).toBe(stripIndent(`
            ${HEADER}
            any:
              foo:
                2 ms (+/- 1.13161 ms) from 3 iterations
            ${FOOTER}
        `).trim() + "\n");
    });

    it("does not infer browser names when disabled", () => {
        [writer, reporter] = makeKarmaReporter({ kelonioReporter: { inferBrowsers: false } });

        // @ts-ignore
        reporter.onBrowserLog("any", `'{"description":["foo"],"durations":[1,2,3]}'`, "kelonio");
        // @ts-ignore
        reporter.onRunComplete();
        expect(writer.mock.calls[0][0]).toBe(stripIndent(`
            ${HEADER}
            foo:
              2 ms (+/- 1.13161 ms) from 3 iterations
            ${FOOTER}
        `).trim() + "\n");
    });

    it("does not print a report when printReportAtEnd is false", async () => {
        [writer, reporter] = makeKarmaReporter({ kelonioReporter: { printReportAtEnd: false } });

        // @ts-ignore
        reporter.onBrowserLog("any", `'{"description":["foo"],"durations":[1,2,3]}'`, "kelonio");
        // @ts-ignore
        reporter.onRunComplete();
        expect(writer.mock.calls).toEqual([]);
    });
});

describe("MochaReporter", () => {
    it("automatically infers descriptions by default", async () => {
        const [runner, reporter] = makeMochaReporter();
        const spy = jest.spyOn(console, "log");

        runner.emit("test", { titlePath: () => ["A", "B"] });
        benchmark.events.emit("record", ["foo"], new Measurement([1, 2, 3]));
        runner.emit("end");

        expect(spy.mock.calls[0][0]).toBe(stripIndent(`
            ${HEADER}
            A:
              B:
                foo:
                  2 ms (+/- 1.13161 ms) from 3 iterations
            ${FOOTER}
        `).trimRight());
    });

    it("does not infer descriptions when disabled", () => {
        const [runner, reporter] = makeMochaReporter({ inferDescriptions: false });
        const spy = jest.spyOn(console, "log");

        runner.emit("test", { titlePath: () => ["A", "B"] });
        benchmark.events.emit("record", ["foo"], new Measurement([1, 2, 3]));
        runner.emit("end");

        expect(spy.mock.calls[0][0]).toBe(stripIndent(`
            ${HEADER}
            foo:
              2 ms (+/- 1.13161 ms) from 3 iterations
            ${FOOTER}
        `).trimRight());
    });

    it("does not print a report when printReportAtEnd is false", async () => {
        const [runner, reporter] = makeMochaReporter({ printReportAtEnd: false });
        const spy = jest.spyOn(console, "log");

        runner.emit("test", { titlePath: () => ["A", "B"] });
        benchmark.events.emit("record", ["foo"], new Measurement([1, 2, 3]));
        runner.emit("end");

        expect(spy.mock.calls).toEqual([]);
    });
});
