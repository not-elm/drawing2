import { describe, expect, it } from "bun:test";
import { cell, derived } from "./ICell";

describe("Cell", () => {
    it("get from and set to mutable cell", () => {
        const c1 = cell(1);

        expect(c1.get()).toBe(1);
        c1.set(2);
        expect(c1.get()).toBe(2);
    });

    it("derived cell", () => {
        const c1 = cell(1);
        const c2 = derived(() => c1.get() * 2);

        expect(c2.get()).toBe(2);

        c1.set(3);
        expect(c2.get()).toBe(6);
    });

    it("cell derived by multiple sources", () => {
        const c1 = cell(1);
        const c2 = cell(2);
        const c3 = derived(() => c1.get() + c2.get());

        expect(c3.get()).toBe(3);

        c1.set(3);
        expect(c3.get()).toBe(5);

        c2.set(4);
        expect(c3.get()).toBe(7);
    });

    it("propagate changes", () => {
        const c1 = cell(1);
        const c2 = derived(() => c1.get() * 2);
        const c3 = derived(() => c2.get() * 3);

        expect(c3.get()).toBe(6);

        c1.set(2);
        expect(c3.get()).toBe(12);
    });
});
