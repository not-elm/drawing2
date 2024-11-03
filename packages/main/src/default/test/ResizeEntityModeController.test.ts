import { describe, expect, test } from "bun:test";
import { ResizeEntityModeController } from "../../core/mode/ResizeEntityModeController";
import { SelectEntityModeController } from "../../core/mode/SelectEntityModeController";
import { Rect } from "../../core/shape/Shape";
import {
    createApp,
    createNativeKeyboardEvent,
    createNativePointerEvent,
    createRectPathEntity,
} from "./utils";

describe("ResizeEntityModeController", () => {
    test("on pointerDown on resize handle, must enter to resize-entity mode", () => {
        const app = createApp();
        app.setMode(SelectEntityModeController.type);

        const entity1 = createRectPathEntity(Rect.of(10, 10, 10, 10));
        app.canvas.edit((builder) => {
            builder.setEntities([entity1]);
        });
        app.canvas.select(entity1.id);

        app.handlePointerDown(
            createNativePointerEvent({ offsetX: 10, offsetY: 10 }),
        );
        expect(app.mode.get()).toBe(ResizeEntityModeController.type);
    });

    test("on pointerMove, selected entities must be resized", () => {
        const app = createApp();
        app.setMode(SelectEntityModeController.type);

        const entity1 = createRectPathEntity(Rect.of(10, 10, 10, 10));
        const entity2 = createRectPathEntity(Rect.of(20, 20, 10, 10));
        app.canvas.edit((builder) => {
            builder.setEntities([entity1, entity2]);
        });
        app.canvas.selectAll();

        app.handlePointerDown(
            createNativePointerEvent({ offsetX: 10, offsetY: 10 }),
        );
        app.handlePointerMove(
            createNativePointerEvent({ offsetX: -10, offsetY: -10 }),
        );

        const updateEntity1 = app.canvas.page.get().entities.get(entity1.id);
        const updateEntity2 = app.canvas.page.get().entities.get(entity2.id);
        const rect1 = app.entityHandle
            .getShape(updateEntity1)
            .getBoundingRect();
        const rect2 = app.entityHandle
            .getShape(updateEntity2)
            .getBoundingRect();

        expect(rect1).toEqual(Rect.of(-10, -10, 20, 20));
        expect(rect2).toEqual(Rect.of(10, 10, 20, 20));
    });

    test("on pointerUp, must exit the mode", async () => {
        const app = createApp();
        app.setMode(SelectEntityModeController.type);

        const entity1 = createRectPathEntity(Rect.of(10, 10, 10, 10));
        app.canvas.edit((builder) => {
            builder.setEntities([entity1]);
        });
        app.canvas.selectAll();

        app.handlePointerDown(
            createNativePointerEvent({ offsetX: 10, offsetY: 10 }),
        );
        expect(app.mode.get()).toEqual(ResizeEntityModeController.type);

        // Sleep 1 sec to avoid onTap event
        await new Promise((resolve) => setTimeout(resolve, 1000));

        app.handlePointerUp(
            createNativePointerEvent({ offsetX: 10, offsetY: 10 }),
        );
        expect(app.mode.get()).toEqual(SelectEntityModeController.type);
    });

    test("When Escape key is pressed, changes must be reverted", () => {
        const app = createApp();
        app.setMode(SelectEntityModeController.type);

        const entity1 = createRectPathEntity(Rect.of(10, 10, 10, 10));
        const entity2 = createRectPathEntity(Rect.of(20, 20, 10, 10));
        app.canvas.edit((builder) => {
            builder.setEntities([entity1, entity2]);
        });
        app.canvas.selectAll();

        app.handlePointerDown(
            createNativePointerEvent({ offsetX: 10, offsetY: 10 }),
        );
        app.handlePointerMove(
            createNativePointerEvent({ offsetX: -10, offsetY: -10 }),
        );
        app.handleKeyDown(createNativeKeyboardEvent({ key: "Escape" }));

        expect(app.mode.get()).toBe(SelectEntityModeController.type);

        const updateEntity1 = app.canvas.page.get().entities.get(entity1.id);
        const updateEntity2 = app.canvas.page.get().entities.get(entity2.id);
        expect(updateEntity1).toEqual(entity1);
        expect(updateEntity2).toEqual(entity2);
    });

    test("With control key, selection must be snapped to other entity", () => {
        const app = createApp();
        app.setMode(SelectEntityModeController.type);

        const entity1 = createRectPathEntity(Rect.of(10, 10, 10, 10));
        const entity2 = createRectPathEntity(Rect.of(100, 100, 10, 10));
        app.canvas.edit((builder) => {
            builder.setEntities([entity1, entity2]);
        });

        app.canvas.select(entity1.id);

        app.handlePointerDown(
            createNativePointerEvent({
                offsetX: 20,
                offsetY: 20,
            }),
        );
        app.handlePointerMove(
            createNativePointerEvent({
                offsetX: 20,
                offsetY: 20 + 79.5,
                ctrlKey: true,
            }),
        );

        const updateEntity1 = app.canvas.page.get().entities.get(entity1.id);

        const newRect1 = app.entityHandle
            .getShape(updateEntity1)
            .getBoundingRect();

        expect(newRect1).toEqual(Rect.of(10, 10, 10, 90));
    });

    test("With shift key, movement must be constraint as keeping the aspect ratio", () => {
        const app = createApp();
        app.setMode(SelectEntityModeController.type);

        const entity1 = createRectPathEntity(Rect.of(10, 10, 20, 10));
        app.canvas.edit((builder) => {
            builder.setEntities([entity1]);
        });

        app.canvas.select(entity1.id);

        app.handlePointerDown(
            createNativePointerEvent({ offsetX: 10, offsetY: 10 }),
        );
        app.handlePointerMove(
            createNativePointerEvent({
                offsetX: 15 + 100,
                offsetY: 15 + 100,
                shiftKey: true,
            }),
        );

        const updateEntity1 = app.canvas.page.get().entities.get(entity1.id);
        const newRect1 = app.entityHandle
            .getShape(updateEntity1)
            .getBoundingRect();

        expect(newRect1.width / newRect1.height).toEqual(2);
    });

    test("Snap must work with considering constraints", () => {
        const app = createApp();
        app.setMode(SelectEntityModeController.type);

        const entity1 = createRectPathEntity(Rect.of(10, 10, 10, 10));
        const entity2 = createRectPathEntity(Rect.of(30, 40, 10, 10));
        app.canvas.edit((builder) => {
            builder.setEntities([entity1, entity2]);
        });

        app.canvas.select(entity1.id);

        app.handlePointerDown(
            createNativePointerEvent({ offsetX: 20, offsetY: 20 }),
        );
        app.handlePointerMove(
            createNativePointerEvent({
                offsetX: 20 + 9,
                offsetY: 20 + 18,
                shiftKey: true,
                ctrlKey: true,
            }),
        );

        const updateEntity1 = app.canvas.page.get().entities.get(entity1.id);
        const newRect1 = app.entityHandle
            .getShape(updateEntity1)
            .getBoundingRect();

        // Keep aspect as 1:1 by ignoring y-snap
        expect(newRect1).toEqual(Rect.of(10, 10, 20, 20));
    });
});
