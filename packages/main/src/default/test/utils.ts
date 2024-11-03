import type { NativeKeyboardEvent, NativePointerEvent } from "../../core/App";
import type { Rect } from "../../core/shape/Shape";
import { noop } from "../../lib/noop";
import { randomId } from "../../lib/randomId";
import { createDefaultApp } from "../createDefaultApp";
import {
    PROPERTY_KEY_ARROW_HEAD_NODE_IDS,
    type PathEntity,
} from "../entity/PathEntity/PathEntity";
import { PROPERTY_KEY_COLOR_ID } from "../property/Colors";
import { PROPERTY_KEY_FILL_STYLE } from "../property/FillStyle";
import { PROPERTY_KEY_STROKE_STYLE } from "../property/StrokeStyle";
import { PROPERTY_KEY_STROKE_WIDTH } from "../property/StrokeWidth";

export function createApp() {
    const app = createDefaultApp({
        enableSyncWithLocalStorage: false,
    });
    app.resizeViewport(800, 600);

    return app;
}

export function createPathEntity(props: Partial<PathEntity> = {}): PathEntity {
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
        [PROPERTY_KEY_ARROW_HEAD_NODE_IDS]: [],
        ...props,
    };
}

export function createRectPathEntity(
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

export function createNativePointerEvent(
    props: Partial<NativePointerEvent> = {},
): NativePointerEvent {
    return {
        pointerId: 0,
        button: 0,
        offsetX: 0,
        offsetY: 0,
        shiftKey: false,
        ctrlKey: false,
        metaKey: false,
        preventDefault: noop,
        ...props,
    };
}

export function createNativeKeyboardEvent(
    props: Partial<NativeKeyboardEvent> = {},
) {
    return {
        key: "(Invalid)",
        altKey: false,
        shiftKey: false,
        ctrlKey: false,
        metaKey: false,
        preventDefault: noop,
        ...props,
    };
}
