import { describe, expect, test } from "bun:test";
import { MoveEntityModeController } from "../../core/mode/MoveEntityModeController";
import { SelectEntityModeController } from "../../core/mode/SelectEntityModeController";
import { Rect } from "../../core/shape/Shape";
import {
    createApp,
    createNativeKeyboardEvent,
    createNativePointerEvent,
    createRectPathEntity,
} from "./utils";

describe("MoveEntityModeController", () => {
    test("on pointerDown on selection, must enter to move-entity mode", () => {
        const app = createApp();
        app.setMode(SelectEntityModeController.type);

        const entity1 = createRectPathEntity(Rect.of(10, 10, 10, 10));
        app.canvas.edit((builder) => {
            builder.setEntities([entity1]);
        });
        app.canvas.select(entity1.id);

        app.handlePointerDown(
            createNativePointerEvent({ clientX: 15, clientY: 15 }),
        );
        expect(app.mode.get()).toBe(MoveEntityModeController.type);
    });

    test("on pointerMove, selected entities must be moved", () => {
        const app = createApp();
        app.setMode(SelectEntityModeController.type);

        const entity1 = createRectPathEntity(Rect.of(10, 10, 10, 10));
        const entity2 = createRectPathEntity(Rect.of(20, 20, 10, 10));
        app.canvas.edit((builder) => {
            builder.setEntities([entity1, entity2]);
        });

        app.canvas.select(entity1.id);
        app.canvas.select(entity2.id);

        app.handlePointerDown(
            createNativePointerEvent({ clientX: 20, clientY: 20 }),
        );
        app.handlePointerMove(
            createNativePointerEvent({ clientX: 30, clientY: 40 }),
        );

        const updateEntity1 = app.canvas.page.get().entities.get(entity1.id);
        const updateEntity2 = app.canvas.page.get().entities.get(entity2.id);

        const rect1 = app.entityHandle
            .getShape(updateEntity1)
            .getBoundingRect();
        const rect2 = app.entityHandle
            .getShape(updateEntity2)
            .getBoundingRect();

        expect(rect1).toEqual(Rect.of(20, 30, 10, 10));
        expect(rect2).toEqual(Rect.of(30, 40, 10, 10));
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
            createNativePointerEvent({ clientX: 15, clientY: 15 }),
        );
        expect(app.mode.get()).toEqual(MoveEntityModeController.type);

        // Sleep 1 sec to avoid onTap event
        await new Promise((resolve) => setTimeout(resolve, 1000));

        app.handlePointerUp(
            createNativePointerEvent({ clientX: 15, clientY: 15 }),
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
            createNativePointerEvent({ clientX: 20, clientY: 20 }),
        );
        app.handlePointerMove(
            createNativePointerEvent({ clientX: 50, clientY: 60 }),
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

        const rect1 = Rect.of(10, 10, 10, 10);
        const rect2 = Rect.of(100, 100, 10, 10);
        const entity1 = createRectPathEntity(rect1);
        const entity2 = createRectPathEntity(rect2);
        app.canvas.edit((builder) => {
            builder.setEntities([entity1, entity2]);
        });

        app.canvas.select(entity1.id);

        app.handlePointerDown(
            createNativePointerEvent({
                clientX: rect1.center.x,
                clientY: rect1.center.y,
            }),
        );
        app.handlePointerMove(
            // If snapped, entity will be moved by 90px in y-axis
            createNativePointerEvent({
                clientX: rect1.center.x,
                clientY: rect1.center.y + 89.5,
                ctrlKey: true,
            }),
        );

        const updateEntity1 = app.canvas.page.get().entities.get(entity1.id);

        const newRect1 = app.entityHandle
            .getShape(updateEntity1)
            .getBoundingRect();

        expect(newRect1).toEqual(Rect.of(10, 100, 10, 10));
    });

    test("With shift key, movement must be constraint in x-axis or y-axis", () => {
        const app = createApp();
        app.setMode(SelectEntityModeController.type);

        const entity1 = createRectPathEntity(Rect.of(10, 10, 10, 10));
        app.canvas.edit((builder) => {
            builder.setEntities([entity1]);
        });

        app.canvas.select(entity1.id);

        app.handlePointerDown(
            createNativePointerEvent({ clientX: 15, clientY: 15 }),
        );
        app.handlePointerMove(
            createNativePointerEvent({
                clientX: 15 + 40,
                clientY: 15 + 60,
                shiftKey: true,
            }),
        );

        const updateEntity1 = app.canvas.page.get().entities.get(entity1.id);
        const newRect1 = app.entityHandle
            .getShape(updateEntity1)
            .getBoundingRect();

        expect(newRect1).toEqual(Rect.of(10, 70, 10, 10));
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
            createNativePointerEvent({ clientX: 15, clientY: 15 }),
        );
        app.handlePointerMove(
            // Snap can be activated in both x and y direction,
            // but x-axis will be ignored since constraint is active and
            // entity is moved more widely in y-axis
            createNativePointerEvent({
                clientX: 15 + 9,
                clientY: 15 + 19,
                shiftKey: true,
                ctrlKey: true,
            }),
        );

        const updateEntity1 = app.canvas.page.get().entities.get(entity1.id);
        const newRect1 = app.entityHandle
            .getShape(updateEntity1)
            .getBoundingRect();

        expect(newRect1).toEqual(Rect.of(10, 30, 10, 10));
    });
});
