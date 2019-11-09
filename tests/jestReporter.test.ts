import fs from "fs";
import stripIndent from "strip-indent";
import { Benchmark, JestReporter } from "../src";
import { STATE_FILE } from "../src/etc";

let reporter: JestReporter;

beforeEach(() => {
    reporter = new JestReporter();
    try { fs.unlinkSync(STATE_FILE); } catch { }
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe("JestReporter", () => {
    describe("initializeKelonio", () => {
        it("deletes the state file if it exists", () => {
            fs.writeFileSync(STATE_FILE, JSON.stringify({
                foo: {
                    durations: [1, 2, 3],
                    children: {},
                }
            }));
            JestReporter.initializeKelonio();
            expect(fs.existsSync(STATE_FILE)).toBeFalsy();
        });

        it("does nothing if the state file is nonexistent", () => {
            JestReporter.initializeKelonio();
            expect(fs.existsSync(STATE_FILE)).toBeFalsy();
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
            // @ts-ignore
            reporter.activeKelonioBenchmark = new Benchmark();

            reporter.onRunComplete();

            expect(spy.mock.calls[0][0]).toBe(stripIndent(`
                - - - - - - - - - - - - - - - - - Performance - - - - - - - - - - - - - - - - -
                foo:
                  2 ms (+/- 1.13161 ms) from 3 iterations
                - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            `).trimRight());
            expect(fs.existsSync(STATE_FILE)).toBeFalsy();
        });
    });
});
