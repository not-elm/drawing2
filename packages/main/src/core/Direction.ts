import type { Point } from "./geo/Point";
import type { Rect } from "./geo/Rect";

export interface Direction {
    getPoint(rect: Rect): Point;
    opposite: Direction;
}

export const Direction = {
    topLeft: {
        getPoint(rect: Rect) {
            return rect.topLeft;
        },
        get opposite(): Direction {
            return Direction.bottomRight;
        },
    },
    top: {
        getPoint(rect: Rect) {
            return rect.topCenter;
        },
        get opposite(): Direction {
            return Direction.bottom;
        },
    },
    topRight: {
        getPoint(rect: Rect) {
            return rect.topRight;
        },
        get opposite(): Direction {
            return Direction.bottomLeft;
        },
    },
    left: {
        getPoint(rect: Rect) {
            return rect.centerLeft;
        },
        get opposite(): Direction {
            return Direction.right;
        },
    },
    right: {
        getPoint(rect: Rect) {
            return rect.centerRight;
        },
        get opposite(): Direction {
            return Direction.left;
        },
    },
    bottomLeft: {
        getPoint(rect: Rect) {
            return rect.bottomLeft;
        },
        get opposite(): Direction {
            return Direction.topRight;
        },
    },
    bottom: {
        getPoint(rect: Rect) {
            return rect.bottomCenter;
        },
        get opposite(): Direction {
            return Direction.top;
        },
    },
    bottomRight: {
        getPoint(rect: Rect) {
            return rect.bottomRight;
        },
        get opposite(): Direction {
            return Direction.topLeft;
        },
    },
};
