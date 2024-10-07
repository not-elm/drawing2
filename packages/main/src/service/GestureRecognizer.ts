import { type StateProvider, Store } from "../lib/Store";
import { fromCanvasCoordinate } from "../store/CanvasStateStore";
import type { ViewportStore } from "../store/ViewportStore";
import type {
    PointerEventSession,
    PointerEventSessionData,
} from "./PointerEventSession/PointerEventSession";

const THRESHOLD_CLICK_DURATION_IN_MILLI = 200;

export interface GestureRecognizerState {
    [sessionId: number]: {
        pointerId: number;
        data: PointerEventSessionData;
        handlers: PointerEventSession | null;
    };
}

export class GestureRecognizer extends Store<GestureRecognizerState> {
    constructor(
        private readonly viewportProvider: StateProvider<ViewportStore>,
    ) {
        super({});
    }

    onPointerDown?: (
        ev: PointerEvent,
        startSession: (initializer: PointerEventSession) => void,
    ) => void;
    onPointerMove?: (ev: PointerEvent) => void;
    onPointerUp?: (ev: PointerEvent) => void;

    handlePointerDown(ev: PointerEvent) {
        let handlers: PointerEventSession | null = null;
        this.onPointerDown?.(ev, (_handlers) => (handlers = _handlers));
        if (handlers === null) return;

        const [x, y] = fromCanvasCoordinate(
            ev.clientX,
            ev.clientY,
            this.viewportProvider.getState(),
        );
        const timestamp = performance.now();
        this.setState({
            ...this.getState(),
            [ev.pointerId]: {
                pointerId: ev.pointerId,
                data: {
                    startAt: timestamp,
                    endAt: timestamp,
                    startX: x,
                    startY: y,
                    lastX: x,
                    lastY: y,
                    newX: x,
                    newY: y,
                    shiftKey: ev.shiftKey,
                    ctrlKey: ev.ctrlKey,
                    metaKey: ev.metaKey,
                },
                handlers,
            },
        });
    }

    handlePointerMove(ev: PointerEvent) {
        this.onPointerMove?.(ev);

        const session = this.getState()[ev.pointerId];
        if (session === undefined) return;

        const [x, y] = fromCanvasCoordinate(
            ev.clientX,
            ev.clientY,
            this.viewportProvider.getState(),
        );

        const newData = { ...session.data };
        newData.newX = x;
        newData.newY = y;
        newData.shiftKey = ev.shiftKey;
        newData.ctrlKey = ev.ctrlKey;
        newData.metaKey = ev.metaKey;
        session.handlers?.onPointerMove?.(newData);
        newData.lastX = x;
        newData.lastY = y;

        this.setState({
            ...this.getState(),
            [ev.pointerId]: {
                ...session,
                data: newData,
            },
        });
    }

    handlePointerUp(ev: PointerEvent) {
        this.onPointerUp?.(ev);

        const session = this.getState()[ev.pointerId];
        if (session === undefined) return;

        const [x, y] = fromCanvasCoordinate(
            ev.clientX,
            ev.clientY,
            this.viewportProvider.getState(),
        );

        const newData = { ...session.data };
        newData.newX = x;
        newData.newY = y;
        newData.shiftKey = ev.shiftKey;
        newData.ctrlKey = ev.ctrlKey;
        newData.metaKey = ev.metaKey;
        newData.endAt = performance.now();
        if (
            newData.endAt - newData.startAt <
            THRESHOLD_CLICK_DURATION_IN_MILLI
        ) {
            (session.handlers?.onClick ?? session.handlers?.onPointerUp)?.(
                newData,
            );
        } else {
            session.handlers?.onPointerUp?.(newData);
        }

        const { [ev.pointerId]: _, ...newState } = this.getState();
        this.setState(newState);
    }
}
