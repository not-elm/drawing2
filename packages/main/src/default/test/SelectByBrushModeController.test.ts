import { describe, expect, test } from "bun:test";
import { SelectByBrushModeController } from "../../core/mode/SelectByBrushModeController";
import { SelectEntityModeController } from "../../core/mode/SelectEntityModeController";
import { Rect } from "../../core/shape/Shape";
import {
    createApp,
    createNativeKeyboardEvent,
    createNativePointerEvent,
    createRectPathEntity,
} from "./utils";

describe("SelectByBrushModeController", () => {
    test("on pointerUp, must enter into the mode", () => {
        const app = createApp();
        app.setMode(SelectEntityModeController.type);

        app.handlePointerDown(
            createNativePointerEvent({ clientX: 5, clientY: 10 }),
        );
        expect(app.mode.get()).toBe(SelectByBrushModeController.type);
    });

    test("on pointerMove, brush rect must be updated", () => {
        const app = createApp();
        app.setMode(SelectEntityModeController.type);

        app.handlePointerDown(
            createNativePointerEvent({ clientX: 5, clientY: 10 }),
        );
        app.handlePointerMove(
            createNativePointerEvent({ clientX: 20, clientY: 30 }),
        );

        const controller = app.getModeControllerByClass(
            SelectByBrushModeController,
        );
        expect(controller.brushRect.get()).toEqual(Rect.of(5, 10, 15, 20));
    });

    test("on pointerUp, must exit from the mode", () => {
        const app = createApp();
        app.setMode(SelectEntityModeController.type);

        app.handlePointerDown(
            createNativePointerEvent({ clientX: 5, clientY: 10 }),
        );
        expect(app.mode.get()).toBe(SelectByBrushModeController.type);

        app.handlePointerMove(
            createNativePointerEvent({ clientX: 20, clientY: 30 }),
        );
        app.handlePointerUp(
            createNativePointerEvent({ clientX: 20, clientY: 30 }),
        );
        expect(app.mode.get()).toBe(SelectEntityModeController.type);
    });

    test("Entities in brush rect must be selected", () => {
        const app = createApp();
        app.setMode(SelectEntityModeController.type);

        const entity1 = createRectPathEntity(Rect.of(10, 10, 10, 10));
        const entity2 = createRectPathEntity(Rect.of(20, 20, 10, 10));
        app.canvas.edit((builder) => {
            builder.setEntities([entity1, entity2]);
        });

        app.handlePointerDown(
            createNativePointerEvent({ clientX: 0, clientY: 0 }),
        );
        app.handlePointerMove(
            createNativePointerEvent({ clientX: 50, clientY: 50 }),
        );
        expect(app.canvas.selectedEntityIds.get()).toEqual(
            new Set([entity1.id, entity2.id]),
        );
    });

    test("Entities leaving from brush rect must be unselected", () => {
        const app = createApp();
        app.setMode(SelectEntityModeController.type);

        const entity1 = createRectPathEntity(Rect.of(10, 10, 10, 10));
        const entity2 = createRectPathEntity(Rect.of(20, 20, 10, 10));
        app.canvas.edit((builder) => {
            builder.setEntities([entity1, entity2]);
        });

        app.handlePointerDown(
            createNativePointerEvent({ clientX: 0, clientY: 0 }),
        );
        app.handlePointerMove(
            createNativePointerEvent({ clientX: 30, clientY: 30 }),
        );
        expect(app.canvas.selectedEntityIds.get()).toEqual(
            new Set([entity1.id, entity2.id]),
        );

        app.handlePointerMove(
            createNativePointerEvent({ clientX: 15, clientY: 15 }),
        );
        expect(app.canvas.selectedEntityIds.get()).toEqual(
            new Set([entity1.id]),
        );
    });

    test("Entities already selected before select-by-brush mode started must be kept selected", () => {
        const app = createApp();
        app.setMode(SelectEntityModeController.type);

        const entity1 = createRectPathEntity(Rect.of(10, 10, 10, 10));
        const entity2 = createRectPathEntity(Rect.of(20, 20, 10, 10));
        app.canvas.edit((builder) => {
            builder.setEntities([entity1, entity2]);
        });
        app.canvas.setSelectedEntityIds(new Set([entity1.id]));

        app.handlePointerDown(
            createNativePointerEvent({
                clientX: 0,
                clientY: 0,
                shiftKey: true,
            }),
        );
        app.handlePointerMove(
            createNativePointerEvent({ clientX: 30, clientY: 30 }),
        );
        expect(app.canvas.selectedEntityIds.get()).toEqual(
            new Set([entity1.id, entity2.id]),
        );

        app.handlePointerMove(
            createNativePointerEvent({ clientX: 0, clientY: 0 }),
        );
        expect(app.canvas.selectedEntityIds.get()).toEqual(
            new Set([entity1.id]),
        );
    });

    test("When Escape key is pressed, exit this mode and revert selection changes", () => {
        const app = createApp();
        app.setMode(SelectEntityModeController.type);

        const entity1 = createRectPathEntity(Rect.of(10, 10, 10, 10));
        const entity2 = createRectPathEntity(Rect.of(20, 20, 10, 10));
        app.canvas.edit((builder) => {
            builder.setEntities([entity1, entity2]);
        });
        app.canvas.setSelectedEntityIds(new Set([entity1.id]));

        app.handlePointerDown(
            createNativePointerEvent({
                clientX: 0,
                clientY: 0,
                shiftKey: true,
            }),
        );
        app.handlePointerMove(
            createNativePointerEvent({ clientX: 30, clientY: 30 }),
        );
        expect(app.canvas.selectedEntityIds.get()).toEqual(
            new Set([entity1.id, entity2.id]),
        );

        app.handleKeyDown(createNativeKeyboardEvent({ key: "Escape" }));

        expect(app.mode.get()).toBe(SelectEntityModeController.type);
        expect(app.canvas.selectedEntityIds.get()).toEqual(
            new Set([entity1.id]),
        );
    });
});
