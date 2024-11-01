import { describe, expect, test } from "bun:test";
import type { NativePointerEvent } from "../../core/App";
import { MoveEntityModeController } from "../../core/mode/MoveEntityModeController";
import { ResizeEntityModeController } from "../../core/mode/ResizeEntityModeController";
import { SelectByBrushModeController } from "../../core/mode/SelectByBrushModeController";
import { SelectEntityModeController } from "../../core/mode/SelectEntityModeController";
import { Rect } from "../../core/shape/Shape";
import { noop } from "../../lib/noop";
import { randomId } from "../../lib/randomId";
import { createDefaultApp } from "../createDefaultApp";
import {
    PROPERTY_KEY_ARROW_HEAD_NODE_IDS,
    PROPERTY_KEY_CORNER_RADIUS,
    type PathEntity,
} from "../entity/PathEntity/PathEntity";
import { PROPERTY_KEY_COLOR_ID } from "../property/Colors";
import { PROPERTY_KEY_FILL_STYLE } from "../property/FillStyle";
import { PROPERTY_KEY_STROKE_STYLE } from "../property/StrokeStyle";
import { PROPERTY_KEY_STROKE_WIDTH } from "../property/StrokeWidth";

describe("SelectEntityMode", () => {
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
                    createNativePointerEventMock({
                        clientX: 5,
                        clientY: 5,
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
                    createNativePointerEventMock({
                        clientX: 5,
                        clientY: 5,
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
                    createNativePointerEventMock({
                        clientX: 10,
                        clientY: 10,
                        shiftKey: true,
                    }),
                );

                expect(app.canvas.selectedEntityIds.get()).toEqual(
                    new Set([entity1.id, entity2.id]),
                );
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
                    createNativePointerEventMock({
                        clientX: 10,
                        clientY: 10,
                        shiftKey: false,
                    }),
                );

                expect(app.canvas.selectedEntityIds.get()).toEqual(
                    new Set([entity2.id]),
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
                    createNativePointerEventMock({
                        clientX: 25,
                        clientY: 25,
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
                    createNativePointerEventMock({
                        clientX: 25,
                        clientY: 25,
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
                    createNativePointerEventMock({
                        clientX: 10,
                        clientY: 10,
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
                    createNativePointerEventMock({
                        clientX: 10,
                        clientY: 10,
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
                    createNativePointerEventMock({
                        clientX: 100,
                        clientY: 100,
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
                    createNativePointerEventMock({
                        clientX: 100,
                        clientY: 100,
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
                createNativePointerEventMock({
                    clientX: 10,
                    clientY: 10,
                }),
            );

            expect(app.mode.get()).toEqual(ResizeEntityModeController.type);
        });

        test("on center of selection rect, enter move-entity mode", () => {
            const app = createApp();

            const entity = createRectPathEntity(Rect.of(0, 0, 10, 10));
            app.canvas.edit((builder) => {
                builder.setEntity(entity);
            });
            app.canvas.select(entity.id);

            app.handlePointerDown(
                createNativePointerEventMock({
                    clientX: 5,
                    clientY: 5,
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
                createNativePointerEventMock({
                    clientX: 25,
                    clientY: 25,
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
                createNativePointerEventMock({
                    clientX: 25,
                    clientY: 25,
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
                    createNativePointerEventMock({
                        clientX: pointerX,
                        clientY: pointerY,
                    }),
                );

                expect(app.cursor.get()).toEqual(expected);
            },
        );
    });
});

function createApp() {
    return createDefaultApp({
        enableSyncWithLocalStorage: false,
    });
}

function createPathEntity(props: Partial<PathEntity> = {}): PathEntity {
    const node1 = { id: randomId(), x: 0, y: 0 };
    const node2 = { id: randomId(), x: 10, y: 10 };
    return {
        id: randomId(),
        type: "path",
        nodes: [node1, node2],
        edges: [[node1.id, node2.id]],
        [PROPERTY_KEY_COLOR_ID]: 0,
        [PROPERTY_KEY_STROKE_STYLE]: "solid",
        [PROPERTY_KEY_STROKE_WIDTH]: 1,
        [PROPERTY_KEY_FILL_STYLE]: "none",
        [PROPERTY_KEY_CORNER_RADIUS]: 0,
        [PROPERTY_KEY_ARROW_HEAD_NODE_IDS]: [],
        ...props,
    };
}

function createRectPathEntity(
    rect: Rect,
    props: Partial<PathEntity> = {},
): PathEntity {
    const node1 = { id: randomId(), x: rect.left, y: rect.top };
    const node2 = { id: randomId(), x: rect.right, y: rect.top };
    const node3 = { id: randomId(), x: rect.right, y: rect.bottom };
    const node4 = { id: randomId(), x: rect.left, y: rect.bottom };

    return {
        ...createPathEntity(props),
        nodes: [node1, node2, node3, node4],
        edges: [
            [node1.id, node2.id],
            [node2.id, node3.id],
            [node3.id, node4.id],
            [node4.id, node1.id],
        ],
    };
}

function createNativePointerEventMock(props: Partial<NativePointerEvent> = {}) {
    return {
        pointerId: 0,
        button: 0,
        clientX: 0,
        clientY: 0,
        shiftKey: false,
        ctrlKey: false,
        metaKey: false,
        preventDefault: noop,
        ...props,
    };
}
