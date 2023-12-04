import { Benchmark } from "..";

const HEADER_SIDE = "- ".repeat(17).trim();
export const HEADER = `${HEADER_SIDE} Performance ${HEADER_SIDE}`;
export const FOOTER = "- ".repeat(40).trim();

export type Extension = {
    extraReport?: (benchmark: Benchmark) => string | void;
};
export type ExtensionLookup = { module: string; extension: string };

export function handleExtraReports(
    lookups: Array<ExtensionLookup> | undefined,
    benchmark: Benchmark,
    print: (report: string) => void
): void {
    for (const lookup of lookups ?? []) {
        const extension: Extension | undefined = require(lookup.module)?.[
            lookup.extension
        ];
        const report = extension?.extraReport?.(benchmark);
        if (report) {
            print(report);
        }
    }
}
