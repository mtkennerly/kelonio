import { benchmark } from "kelonio";

describe("A Mocha test", () => {
    it("can use Kelonio without a description", async () => {
        await benchmark.record(() => { });
    });

    it("can use Kelonio with a simple description", async () => {
        await benchmark.record("simple description", () => { });
    });

    it("can use Kelonio with a nested description", async () => {
        await benchmark.record(["nested", "description"], () => { }, { minUnder: 0 });
    });
});
