import { describe, expect, test } from "bun:test";
import { App } from "../../core/App";

describe("Viewport", () => {
    test("Viewport should be initialized as (0,0,100%)", () => {
        const app = new App();
        const viewport = app.viewport.get();
        expect(viewport.rect.left).toBe(0);
        expect(viewport.rect.top).toBe(0);
        expect(viewport.scale).toBe(1);
    });

    test("Move position", () => {
        const app = new App();
        app.handleScroll(100, 50);

        const viewport = app.viewport.get();
        expect(viewport.rect.left).toBe(100);
        expect(viewport.rect.top).toBe(50);
    });

    test("Scroll size should be scaled based on the current viewport setting", () => {
        const app = new App();
        app.scaleViewport(2, 0, 0);
        app.handleScroll(100, 50);

        const viewport = app.viewport.get();
        expect(viewport.rect.left).toBe(50);
        expect(viewport.rect.top).toBe(25);
    });

    test("Set scale", () => {
        const app = new App();
        app.handleScale(2, 0, 0);

        const viewport = app.viewport.get();
        expect(viewport.rect.left).toBe(0);
        expect(viewport.rect.top).toBe(0);
        expect(viewport.scale).toBe(2);
    });

    test("Origin position shouldn't be moved during scaling", () => {
        const app = new App();
        app.handleScale(2, 100, 60);

        const viewport = app.viewport.get();

        // The origin of the scaling (100, 60) should be still at
        // (100, 60) in canvas coordinate = (50, 30) in viewport coordinate
        expect(viewport.rect.left).toBe(50);
        expect(viewport.rect.top).toBe(30);
        expect(viewport.scale).toBe(2);
    });
});
