import { assert } from "../lib/assert";
import type { App, NativePointerEvent } from "./App";
import type { CanvasPointerEvent } from "./ModeController";
import { Point } from "./shape/Point";

const THRESHOLD_CLICK_DURATION_IN_MILLI = 200;

export class GestureRecognizer {
    constructor(private readonly app: App) {}

    private readonly sessions = new Map<number, PointerEventSession>();
    private readonly sessionIdsWithListener = new Set<number>();
    private readonly pointerMoveHandlers = new Set<
        (app: App, ev: CanvasPointerMoveEvent) => void
    >();
    private readonly pointerUpHandlers = new Set<
        (app: App, ev: CanvasPointerUpEvent) => void
    >();

    handlePointerDown(nativeEv: NativePointerEvent) {
        const point = this.app.viewport
            .get()
            .fromCanvasCoordinateTransform.apply(
                new Point(nativeEv.clientX, nativeEv.clientY),
            );

        this.sessions.set(nativeEv.pointerId, {
            pointerId: nativeEv.pointerId,
            startAt: performance.now(),
            startPoint: point,
            lastPoint: point,
            pointerMoveHandlers: new Set(),
            pointerUpHandlers: new Set(),
        });
    }

    handlePointerMove(nativeEv: NativePointerEvent) {
        const session = this.sessions.get(nativeEv.pointerId);
        const point = this.app.viewport
            .get()
            .fromCanvasCoordinateTransform.apply(
                new Point(nativeEv.clientX, nativeEv.clientY),
            );
        const ev: CanvasPointerMoveEvent = {
            point,
            button:
                nativeEv.button === MouseEventButton.MAIN ? "main" : "other",
            pointerId: nativeEv.pointerId,
            shiftKey: nativeEv.shiftKey,
            ctrlKey: nativeEv.ctrlKey,
            metaKey: nativeEv.metaKey,
            preventDefault: (): void => {
                throw new Error("Function not implemented.");
            },
            startPoint: session?.startPoint ?? point,
            lastPoint: session?.lastPoint ?? point,
        };

        if (session !== undefined) {
            for (const handler of session.pointerMoveHandlers) {
                handler(this.app, ev);
            }
            session.lastPoint = ev.point;
        }
        for (const handler of this.pointerMoveHandlers) {
            handler(this.app, ev);
        }
    }

    handlePointerUp(nativeEv: PointerEvent) {
        const session = this.sessions.get(nativeEv.pointerId);
        if (session === undefined) return;

        const ev: CanvasPointerUpEvent = {
            point: this.app.viewport
                .get()
                .fromCanvasCoordinateTransform.apply(
                    new Point(nativeEv.clientX, nativeEv.clientY),
                ),
            button:
                nativeEv.button === MouseEventButton.MAIN ? "main" : "other",
            pointerId: nativeEv.pointerId,
            shiftKey: nativeEv.shiftKey,
            ctrlKey: nativeEv.ctrlKey,
            metaKey: nativeEv.metaKey,
            preventDefault: (): void => {
                throw new Error("Function not implemented.");
            },
            startPoint: session.startPoint,
            lastPoint: session.lastPoint,
            isTap:
                performance.now() - session.startAt <
                THRESHOLD_CLICK_DURATION_IN_MILLI,
        };

        for (const handler of session.pointerUpHandlers) {
            handler(this.app, ev);
        }
        for (const handler of this.pointerUpHandlers) {
            handler(this.app, ev);
        }

        this.sessions.delete(nativeEv.pointerId);
        this.sessionIdsWithListener.delete(nativeEv.pointerId);
    }

    addPointerMoveHandler(
        handler: (app: App, ev: CanvasPointerMoveEvent) => void,
    ): GestureRecognizer {
        this.pointerMoveHandlers.add(handler);
        return this;
    }

    addPointerUpHandler(
        handler: (app: App, ev: CanvasPointerUpEvent) => void,
    ): GestureRecognizer {
        this.pointerUpHandlers.add(handler);
        return this;
    }

    deletePointerMoveHandler(
        handler: (app: App, ev: CanvasPointerMoveEvent) => void,
    ): GestureRecognizer {
        this.pointerMoveHandlers.delete(handler);
        return this;
    }

    deletePointerUpHandler(
        handler: (app: App, ev: CanvasPointerUpEvent) => void,
    ): GestureRecognizer {
        this.pointerUpHandlers.delete(handler);
        return this;
    }

    addPointerMoveHandlerForPointer(
        pointerId: number,
        handler: (app: App, ev: CanvasPointerMoveEvent) => void,
    ): GestureRecognizer {
        const session = this.sessions.get(pointerId);
        assert(
            session !== undefined,
            `Pointer session ${pointerId} is not found`,
        );

        session.pointerMoveHandlers.add(handler);
        this.sessionIdsWithListener.add(pointerId);
        return this;
    }

    addPointerUpHandlerForPointer(
        pointerId: number,
        handler: (app: App, ev: CanvasPointerUpEvent) => void,
    ): GestureRecognizer {
        const session = this.sessions.get(pointerId);
        assert(
            session !== undefined,
            `Pointer session ${pointerId} is not found`,
        );

        session.pointerUpHandlers.add(handler);
        this.sessionIdsWithListener.add(pointerId);
        return this;
    }

    /**
     * Returns true if there is at least one pointer event session on going.
     */
    inPointerEventSession(): boolean {
        return this.sessionIdsWithListener.size > 0;
    }
}

export interface CanvasPointerMoveEvent extends CanvasPointerEvent {
    startPoint: Point;
    lastPoint: Point;
}

export interface CanvasPointerUpEvent extends CanvasPointerEvent {
    startPoint: Point;
    lastPoint: Point;

    /**
     * A flag that is set to true if the this pointer up event is
     * classified as a "Tap," meaning the touch was brief and
     * involved minimal movement.
     */
    isTap: boolean;
}

interface PointerEventSession {
    pointerId: number;
    startAt: number;
    startPoint: Point;
    lastPoint: Point;
    pointerMoveHandlers: Set<(app: App, ev: CanvasPointerMoveEvent) => void>;
    pointerUpHandlers: Set<(app: App, ev: CanvasPointerUpEvent) => void>;
}

export const MouseEventButton = {
    MAIN: 0,
    AUXILIARY: 1,
    SECONDARY: 2,
    FOURTH: 3,
    FIFTH: 4,
};
