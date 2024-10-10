import type { Rect } from "../geo/Rect";

export type DirectionKind =
    | "topLeft"
    | "top"
    | "topRight"
    | "left"
    | "right"
    | "bottomLeft"
    | "bottom"
    | "bottomRight";

export interface Direction {
    getPoint(rect: Rect): { x: number; y: number };
    opposite: Direction;
}

export const Direction = {
    topLeft: {
        getPoint(rect: Rect) {
            return { x: rect.x, y: rect.y };
        },
        get opposite(): Direction {
            return Direction.bottomRight;
        },
    },
    top: {
        getPoint(rect: Rect) {
            return { x: rect.x + rect.width / 2, y: rect.y };
        },
        get opposite(): Direction {
            return Direction.bottom;
        },
    },
    topRight: {
        getPoint(rect: Rect) {
            return { x: rect.x + rect.width, y: rect.y };
        },
        get opposite(): Direction {
            return Direction.bottomLeft;
        },
    },
    left: {
        getPoint(rect: Rect) {
            return { x: rect.x, y: rect.y + rect.height / 2 };
        },
        get opposite(): Direction {
            return Direction.right;
        },
    },
    right: {
        getPoint(rect: Rect) {
            return { x: rect.x + rect.width, y: rect.y + rect.height / 2 };
        },
        get opposite(): Direction {
            return Direction.left;
        },
    },
    bottomLeft: {
        getPoint(rect: Rect) {
            return { x: rect.x, y: rect.y + rect.height };
        },
        get opposite(): Direction {
            return Direction.topRight;
        },
    },
    bottom: {
        getPoint(rect: Rect) {
            return { x: rect.x + rect.width / 2, y: rect.y + rect.height };
        },
        get opposite(): Direction {
            return Direction.top;
        },
    },
    bottomRight: {
        getPoint(rect: Rect) {
            return { x: rect.x + rect.width, y: rect.y + rect.height };
        },
        get opposite(): Direction {
            return Direction.topLeft;
        },
    },
};
