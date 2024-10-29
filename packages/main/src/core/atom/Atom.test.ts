import { describe, expect, it } from "bun:test";
import { atom, derived } from "./Atom";

describe("Atom", () => {
    it("get from and set to mutable atom", () => {
        const a1 = atom(1);

        expect(a1.get()).toBe(1);
        a1.set(2);
        expect(a1.get()).toBe(2);
    });

    it("derived atom", () => {
        const a1 = atom(1);
        const a2 = derived(() => a1.get() * 2);

        expect(a2.get()).toBe(2);

        a1.set(3);
        expect(a2.get()).toBe(6);
    });

    it("atom derived by multiple sources", () => {
        const a1 = atom(1);
        const a2 = atom(2);
        const a3 = derived(() => a1.get() + a2.get());

        expect(a3.get()).toBe(3);

        a1.set(3);
        expect(a3.get()).toBe(5);

        a2.set(4);
        expect(a3.get()).toBe(7);
    });

    it("propagate changes", () => {
        const a1 = atom(1);
        const a2 = derived(() => a1.get() * 2);
        const a3 = derived(() => a2.get() * 3);

        expect(a3.get()).toBe(6);

        a1.set(2);
        expect(a3.get()).toBe(12);
    });
});
