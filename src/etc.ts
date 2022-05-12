import * as fsModule from "fs";

export const STATE_FILE = ".kelonio.state.json";
const HEADER_SIDE = "- ".repeat(17).trim();
export const HEADER = `${HEADER_SIDE} Performance ${HEADER_SIDE}`;
export const FOOTER = "- ".repeat(40).trim();

let fs: typeof fsModule;
let canUseFs = true;
try {
    fs = require("fs");
} catch {
    canUseFs = false;
}

export class BenchmarkFileState {
    constructor() {
        if (!canUseFs) {
            throw new Error("Unable to access file system");
        }
    }

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
        try { fs.unlinkSync(STATE_FILE); } catch { }
    }
}
