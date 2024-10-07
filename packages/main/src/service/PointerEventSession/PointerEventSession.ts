export interface PointerEventSession {
    type: string;
    onPointerMove?: (data: PointerEventSessionData) => void;
    onPointerUp?: (data: PointerEventSessionData) => void;
    // If specified, onPointerUp won't be called for sessions within a short period of time.
    // Can be used to distinguish from long pressing like dragging.
    onClick?: (data: PointerEventSessionData) => void;
}

export interface PointerEventSessionData {
    startAt: number;
    endAt: number;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    newX: number;
    newY: number;
    shiftKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
}
