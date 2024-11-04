import { describe, expect, test } from "bun:test";
import { MoveEntityModeController } from "../../core/mode/MoveEntityModeController";
import { ResizeEntityModeController } from "../../core/mode/ResizeEntityModeController";
import { SelectByBrushModeController } from "../../core/mode/SelectByBrushModeController";
import { SelectEntityModeController } from "../../core/mode/SelectEntityModeController";
import { Point } from "../../core/shape/Point";
import { Rect } from "../../core/shape/Shape";
import type { TextEntity } from "../entity/TextEntity/TextEntity";
import {
    createApp,
    createNativePointerEvent,
    createRectPathEntity,
} from "./utils";

describe("SelectEntityModeController", () => {
    test("App should be initialized as select-entity mode", () => {
        const app = createApp();
        expect(app.mode.get()).toBe(SelectEntityModeController.type);
    });

    describe("selection change by pointerDown", () => {
        describe("on selected entity in selection rect", () => {
            test("with shiftKey pressed, selection is not changed", () => {
                const app = createApp();

                const entity = createRectPathEntity(Rect.of(0, 0, 10, 10));
                app.canvas.edit((builder) => {
                    builder.setEntity(entity);
                });
                app.canvas.select(entity.id);

                app.handlePointerDown(
                    createNativePointerEvent({
                        canvasPoint: new Point(5, 5),
                        shiftKey: true,
                    }),
                );

                expect(app.canvas.selectedEntityIds.get()).toEqual(
                    new Set([entity.id]),
                );
            });

            test("without shiftKey pressed, selection is not changed", () => {
                const app = createApp();

                const entity = createRectPathEntity(Rect.of(0, 0, 10, 10));
                app.canvas.edit((builder) => {
                    builder.setEntity(entity);
                });
                app.canvas.select(entity.id);

                app.handlePointerDown(
                    createNativePointerEvent({
                        canvasPoint: new Point(5, 5),
                        shiftKey: false,
                    }),
                );

                expect(app.canvas.selectedEntityIds.get()).toEqual(
                    new Set([entity.id]),
                );
            });
        });

        describe("on non-selected entity in selection rect", () => {
            // Try transformation by dragging first. Select behind
            // entities in pointerUp event if it's a tap action.

            test("with shiftKey pressed, selection must not be changed", () => {
                const app = createApp();

                const entity1 = createRectPathEntity(Rect.of(0, 0, 20, 20));
                const entity2 = createRectPathEntity(Rect.of(5, 5, 10, 10));
                app.canvas.edit((builder) => {
                    builder.setEntities([entity1, entity2]);
                });
                app.canvas.select(entity1.id);

                app.handlePointerDown(
                    createNativePointerEvent({
                        canvasPoint: new Point(10, 10),
                        shiftKey: true,
                    }),
                );

                expect(app.canvas.selectedEntityIds.get()).toEqual(
                    new Set([entity1.id]),
                );
            });

            test("without shiftKey pressed, selection must not be changed", () => {
                const app = createApp();

                const entity1 = createRectPathEntity(Rect.of(0, 0, 20, 20));
                const entity2 = createRectPathEntity(Rect.of(5, 5, 10, 10));
                app.canvas.edit((builder) => {
                    builder.setEntities([entity1, entity2]);
                });
                app.canvas.select(entity1.id);

                app.handlePointerDown(
                    createNativePointerEvent({
                        canvasPoint: new Point(10, 10),
                        shiftKey: false,
                    }),
                );

                expect(app.canvas.selectedEntityIds.get()).toEqual(
                    new Set([entity1.id]),
                );
            });
        });

        describe("on non-selected entity outside of selection rect", () => {
            test("with shiftKey pressed, selection is not changed", () => {
                const app = createApp();

                const entity1 = createRectPathEntity(Rect.of(0, 0, 10, 10));
                const entity2 = createRectPathEntity(Rect.of(20, 20, 10, 10));
                app.canvas.edit((builder) => {
                    builder.setEntities([entity1, entity2]);
                });
                app.canvas.select(entity1.id);

                app.handlePointerDown(
                    createNativePointerEvent({
                        canvasPoint: new Point(25, 25),
                        shiftKey: true,
                    }),
                );

                expect(app.canvas.selectedEntityIds.get()).toEqual(
                    new Set([entity1.id, entity2.id]),
                );
            });

            test("without shiftKey pressed, selection is not changed", () => {
                const app = createApp();

                const entity1 = createRectPathEntity(Rect.of(0, 0, 10, 10));
                const entity2 = createRectPathEntity(Rect.of(20, 20, 10, 10));
                app.canvas.edit((builder) => {
                    builder.setEntities([entity1, entity2]);
                });
                app.canvas.select(entity1.id);

                app.handlePointerDown(
                    createNativePointerEvent({
                        canvasPoint: new Point(25, 25),
                        shiftKey: false,
                    }),
                );

                expect(app.canvas.selectedEntityIds.get()).toEqual(
                    new Set([entity2.id]),
                );
            });
        });

        describe("on canvas in selection rect", () => {
            test("with shiftKey pressed, selection is not changed", () => {
                const app = createApp();

                const entity1 = createRectPathEntity(Rect.of(0, 0, 20, 5));
                const entity2 = createRectPathEntity(Rect.of(0, 0, 5, 20));
                app.canvas.edit((builder) => {
                    builder.setEntities([entity1, entity2]);
                });
                app.canvas.selectAll();

                app.handlePointerDown(
                    createNativePointerEvent({
                        canvasPoint: new Point(10, 10),
                        shiftKey: true,
                    }),
                );

                expect(app.canvas.selectedEntityIds.get()).toEqual(
                    new Set([entity1.id, entity2.id]),
                );
            });

            test("without shiftKey pressed, selection is not changed", () => {
                const app = createApp();

                const entity1 = createRectPathEntity(Rect.of(0, 0, 20, 5));
                const entity2 = createRectPathEntity(Rect.of(0, 0, 5, 20));
                app.canvas.edit((builder) => {
                    builder.setEntities([entity1, entity2]);
                });
                app.canvas.selectAll();

                app.handlePointerDown(
                    createNativePointerEvent({
                        canvasPoint: new Point(10, 10),
                        shiftKey: false,
                    }),
                );

                expect(app.canvas.selectedEntityIds.get()).toEqual(
                    new Set([entity1.id, entity2.id]),
                );
            });
        });

        describe("on canvas outside of selection rect", () => {
            test("with shiftKey pressed, selection is not changed", () => {
                const app = createApp();

                const entity1 = createRectPathEntity(Rect.of(0, 0, 10, 10));
                app.canvas.edit((builder) => {
                    builder.setEntities([entity1]);
                });
                app.canvas.selectAll();

                app.handlePointerDown(
                    createNativePointerEvent({
                        canvasPoint: new Point(100, 100),
                        shiftKey: true,
                    }),
                );

                expect(app.canvas.selectedEntityIds.get()).toEqual(
                    new Set([entity1.id]),
                );
            });

            test("without shiftKey pressed, clear all selections", () => {
                const app = createApp();

                const entity1 = createRectPathEntity(Rect.of(0, 0, 10, 10));
                app.canvas.edit((builder) => {
                    builder.setEntities([entity1]);
                });
                app.canvas.selectAll();

                app.handlePointerDown(
                    createNativePointerEvent({
                        canvasPoint: new Point(100, 100),
                        shiftKey: false,
                    }),
                );

                expect(app.canvas.selectedEntityIds.get()).toEqual(new Set([]));
            });
        });
    });

    describe("selection change by pointerUp", () => {
        describe("on selected entity in selection rect", () => {
            test("with shiftKey pressed, selection is not changed", () => {
                const app = createApp();

                const entity = createRectPathEntity(Rect.of(0, 0, 10, 10));
                app.canvas.edit((builder) => {
                    builder.setEntity(entity);
                });
                app.canvas.select(entity.id);

                app.handlePointerDown(
                    createNativePointerEvent({
                        canvasPoint: new Point(5, 5),
                        shiftKey: true,
                    }),
                );
                app.handlePointerUp(
                    createNativePointerEvent({
                        canvasPoint: new Point(5, 5),
                        shiftKey: true,
                    }),
                );

                expect(app.canvas.selectedEntityIds.get()).toEqual(
                    new Set([entity.id]),
                );
            });

            test("without shiftKey pressed, selection is not changed", () => {
                const app = createApp();

                const entity = createRectPathEntity(Rect.of(0, 0, 10, 10));
                app.canvas.edit((builder) => {
                    builder.setEntity(entity);
                });
                app.canvas.select(entity.id);

                app.handlePointerDown(
                    createNativePointerEvent({
                        canvasPoint: new Point(5, 5),
                        shiftKey: false,
                    }),
                );
                app.handlePointerUp(
                    createNativePointerEvent({
                        canvasPoint: new Point(5, 5),
                        shiftKey: false,
                    }),
                );

                expect(app.canvas.selectedEntityIds.get()).toEqual(
                    new Set([entity.id]),
                );
            });
        });

        describe("on non-selected entity in selection rect", () => {
            test("with shiftKey pressed, add that entity to selection", () => {
                const app = createApp();

                const entity1 = createRectPathEntity(Rect.of(0, 0, 20, 20));
                const entity2 = createRectPathEntity(Rect.of(5, 5, 10, 10));
                app.canvas.edit((builder) => {
                    builder.setEntities([entity1, entity2]);
                });
                app.canvas.select(entity1.id);

                app.handlePointerDown(
                    createNativePointerEvent({
                        canvasPoint: new Point(10, 10),
                        shiftKey: true,
                    }),
                );
                app.handlePointerUp(
                    createNativePointerEvent({
                        canvasPoint: new Point(10, 10),
                        shiftKey: true,
                    }),
                );

                expect(app.canvas.selectedEntityIds.get()).toEqual(
                    new Set([entity1.id, entity2.id]),
                );
                expect(app.mode.get()).toEqual(SelectEntityModeController.type);
            });

            test("without shiftKey pressed, select only entity under the pointer", () => {
                const app = createApp();

                const entity1 = createRectPathEntity(Rect.of(0, 0, 20, 20));
                const entity2 = createRectPathEntity(Rect.of(5, 5, 10, 10));
                app.canvas.edit((builder) => {
                    builder.setEntities([entity1, entity2]);
                });
                app.canvas.select(entity1.id);

                app.handlePointerDown(
                    createNativePointerEvent({
                        canvasPoint: new Point(10, 10),
                        shiftKey: false,
                    }),
                );
                app.handlePointerUp(
                    createNativePointerEvent({
                        canvasPoint: new Point(10, 10),
                        shiftKey: false,
                    }),
                );

                expect(app.canvas.selectedEntityIds.get()).toEqual(
                    new Set([entity2.id]),
                );
                expect(app.mode.get()).toEqual(SelectEntityModeController.type);
            });
        });

        describe("on non-selected entity outside of selection rect", () => {
            test("with shiftKey pressed, selection is not changed", () => {
                const app = createApp();

                const entity1 = createRectPathEntity(Rect.of(0, 0, 10, 10));
                const entity2 = createRectPathEntity(Rect.of(20, 20, 10, 10));
                app.canvas.edit((builder) => {
                    builder.setEntities([entity1, entity2]);
                });
                app.canvas.select(entity1.id);

                app.handlePointerDown(
                    createNativePointerEvent({
                        canvasPoint: new Point(25, 25),
                        shiftKey: true,
                    }),
                );
                app.handlePointerUp(
                    createNativePointerEvent({
                        canvasPoint: new Point(25, 25),
                        shiftKey: true,
                    }),
                );

                expect(app.canvas.selectedEntityIds.get()).toEqual(
                    new Set([entity1.id, entity2.id]),
                );
                expect(app.mode.get()).toEqual(SelectEntityModeController.type);
            });

            test("without shiftKey pressed, selection is not changed", () => {
                const app = createApp();

                const entity1 = createRectPathEntity(Rect.of(0, 0, 10, 10));
                const entity2 = createRectPathEntity(Rect.of(20, 20, 10, 10));
                app.canvas.edit((builder) => {
                    builder.setEntities([entity1, entity2]);
                });
                app.canvas.select(entity1.id);

                app.handlePointerDown(
                    createNativePointerEvent({
                        canvasPoint: new Point(25, 25),
                        shiftKey: false,
                    }),
                );
                app.handlePointerUp(
                    createNativePointerEvent({
                        canvasPoint: new Point(25, 25),
                        shiftKey: false,
                    }),
                );

                expect(app.canvas.selectedEntityIds.get()).toEqual(
                    new Set([entity2.id]),
                );
                expect(app.mode.get()).toEqual(SelectEntityModeController.type);
            });
        });

        describe("on canvas in selection rect", () => {
            test("with shiftKey pressed, selection is not changed", () => {
                const app = createApp();

                const entity1 = createRectPathEntity(Rect.of(0, 0, 200, 5));
                const entity2 = createRectPathEntity(Rect.of(0, 0, 5, 200));
                app.canvas.edit((builder) => {
                    builder.setEntities([entity1, entity2]);
                });
                app.canvas.selectAll();

                app.handlePointerDown(
                    createNativePointerEvent({
                        canvasPoint: new Point(100, 100),
                        shiftKey: true,
                    }),
                );
                app.handlePointerUp(
                    createNativePointerEvent({
                        canvasPoint: new Point(100, 100),
                        shiftKey: true,
                    }),
                );

                expect(app.canvas.selectedEntityIds.get()).toEqual(
                    new Set([entity1.id, entity2.id]),
                );
            });

            test("without shiftKey pressed, selection is not changed", () => {
                const app = createApp();

                const entity1 = createRectPathEntity(Rect.of(0, 0, 200, 5));
                const entity2 = createRectPathEntity(Rect.of(0, 0, 5, 200));
                app.canvas.edit((builder) => {
                    builder.setEntities([entity1, entity2]);
                });
                app.canvas.selectAll();

                app.handlePointerDown(
                    createNativePointerEvent({
                        canvasPoint: new Point(100, 100),
                        shiftKey: false,
                    }),
                );
                app.handlePointerUp(
                    createNativePointerEvent({
                        canvasPoint: new Point(100, 100),
                        shiftKey: false,
                    }),
                );

                expect(app.canvas.selectedEntityIds.get()).toEqual(
                    new Set([entity1.id, entity2.id]),
                );
            });
        });

        describe("on canvas outside of selection rect", () => {
            test("with shiftKey pressed, selection is not changed", () => {
                const app = createApp();

                const entity1 = createRectPathEntity(Rect.of(0, 0, 10, 10));
                app.canvas.edit((builder) => {
                    builder.setEntities([entity1]);
                });
                app.canvas.selectAll();

                app.handlePointerDown(
                    createNativePointerEvent({
                        canvasPoint: new Point(100, 100),
                        shiftKey: true,
                    }),
                );
                app.handlePointerUp(
                    createNativePointerEvent({
                        canvasPoint: new Point(100, 100),
                        shiftKey: true,
                    }),
                );

                expect(app.canvas.selectedEntityIds.get()).toEqual(
                    new Set([entity1.id]),
                );
            });

            test("without shiftKey pressed, clear all selections", () => {
                const app = createApp();

                const entity1 = createRectPathEntity(Rect.of(0, 0, 10, 10));
                app.canvas.edit((builder) => {
                    builder.setEntities([entity1]);
                });
                app.canvas.selectAll();

                app.handlePointerDown(
                    createNativePointerEvent({
                        canvasPoint: new Point(100, 100),
                        shiftKey: false,
                    }),
                );
                app.handlePointerUp(
                    createNativePointerEvent({
                        canvasPoint: new Point(100, 100),
                        shiftKey: false,
                    }),
                );

                expect(app.canvas.selectedEntityIds.get()).toEqual(new Set([]));
            });
        });
    });

    describe("mode transition by pointerDown", () => {
        test("on resize handle, enter resize-entity mode", () => {
            const app = createApp();

            const entity = createRectPathEntity(Rect.of(0, 0, 10, 10));
            app.canvas.edit((builder) => {
                builder.setEntity(entity);
            });
            app.canvas.select(entity.id);

            app.handlePointerDown(
                createNativePointerEvent({
                    canvasPoint: new Point(10, 10),
                }),
            );

            expect(app.mode.get()).toEqual(ResizeEntityModeController.type);
        });

        test("Resize handle must be prioritized over entities behind", () => {
            const app = createApp();

            const entity1 = createRectPathEntity(Rect.of(5, 5, 10, 10));
            const entity2 = createRectPathEntity(Rect.of(0, 0, 10, 10));
            app.canvas.edit((builder) => {
                builder.setEntities([entity1, entity2]);
            });
            app.canvas.select(entity1.id);

            app.handlePointerDown(
                createNativePointerEvent({ canvasPoint: new Point(4.5, 4.5) }),
            );

            expect(app.mode.get()).toEqual(ResizeEntityModeController.type);
            expect(app.canvas.selectedEntityIds.get()).toEqual(
                new Set([entity1.id]),
            );
        });

        test("on center of selection rect, enter move-entity mode", () => {
            const app = createApp();

            const entity = createRectPathEntity(Rect.of(0, 0, 10, 10));
            app.canvas.edit((builder) => {
                builder.setEntity(entity);
            });
            app.canvas.select(entity.id);

            app.handlePointerDown(
                createNativePointerEvent({
                    canvasPoint: new Point(5, 5),
                }),
            );

            expect(app.mode.get()).toEqual(MoveEntityModeController.type);
        });

        test("on entity outside of selection rect, enter move-entity mode", () => {
            const app = createApp();

            const entity1 = createRectPathEntity(Rect.of(0, 0, 10, 10));
            const entity2 = createRectPathEntity(Rect.of(20, 20, 10, 10));
            app.canvas.edit((builder) => {
                builder.setEntities([entity1, entity2]);
            });
            app.canvas.select(entity1.id);

            app.handlePointerDown(
                createNativePointerEvent({
                    canvasPoint: new Point(25, 25),
                }),
            );

            expect(app.mode.get()).toEqual(MoveEntityModeController.type);
        });

        test("on canvas outside of selection rect, enter select-by-brush mode", () => {
            const app = createApp();

            const entity1 = createRectPathEntity(Rect.of(0, 0, 10, 10));
            app.canvas.edit((builder) => {
                builder.setEntities([entity1]);
            });
            app.canvas.select(entity1.id);

            app.handlePointerDown(
                createNativePointerEvent({
                    canvasPoint: new Point(25, 25),
                }),
            );

            expect(app.mode.get()).toEqual(SelectByBrushModeController.type);
        });
    });

    describe("cursor", () => {
        test.each([
            [0, 0, "default"],
            [10, 10, "nwse-resize"],
            [10, 30, "nesw-resize"],
            [30, 30, "nwse-resize"],
            [30, 10, "nesw-resize"],
            [10, 20, "ew-resize"],
            [20, 10, "ns-resize"],
            [30, 20, "ew-resize"],
            [20, 30, "ns-resize"],
        ])(
            "cursor must be changed based on the position: (%i, %i) => %s",
            (pointerX, pointerY, expected) => {
                const app = createApp();

                const entity = createRectPathEntity(Rect.of(10, 10, 20, 20));
                app.canvas.edit((builder) => {
                    builder.setEntity(entity);
                });
                app.canvas.select(entity.id);

                app.handlePointerMove(
                    createNativePointerEvent({
                        canvasPoint: new Point(pointerX, pointerY),
                    }),
                );

                expect(app.cursor.get()).toEqual(expected);
            },
        );
    });

    test("on doubleClick, create new TextEntity and enter edit-text mode", () => {
        const app = createApp();
        app.handleDoubleClick(
            createNativePointerEvent({ canvasPoint: new Point(10, 20) }),
        );

        const entities = Array.from(app.canvas.page.get().entities.values());
        expect(entities.length).toEqual(1);

        const entity = entities[0];
        expect(entity.type).toEqual("text");

        const textEntity = entity as TextEntity;
        expect(textEntity.x).toEqual(10);
        expect(textEntity.y).toEqual(20);

        expect(app.mode.get()).toEqual("edit-text");
        expect(app.canvas.selectedEntityIds.get()).toEqual(
            new Set([entity.id]),
        );
    });

    test("on contextMenu on an entity, open context menu with selecting the entity", () => {
        const app = createApp();

        const entity = createRectPathEntity(Rect.of(0, 0, 10, 10));
        app.canvas.edit((builder) => {
            builder.setEntity(entity);
        });

        app.handleContextMenu(
            createNativePointerEvent({ canvasPoint: new Point(5, 5) }),
        );

        expect(app.canvas.selectedEntityIds.get()).toEqual(
            new Set([entity.id]),
        );
    });
});
