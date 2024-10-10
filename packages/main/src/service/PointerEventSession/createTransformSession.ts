import type { TransformHandle } from "../../model/TransformHandle";
import type { HistoryManager } from "../HistoryManager";
import type { PointerEventHandlers } from "./PointerEventSession";

export function createTransformSession(
    historyManager: HistoryManager,
    initHandle: () => TransformHandle,
): PointerEventHandlers {
    let transformHandle: TransformHandle | undefined = undefined;

    return {
        onPointerDown() {
            historyManager.pause();
            transformHandle = initHandle();
        },
        onPointerMove(data) {
            transformHandle?.apply(
                { x: data.newX, y: data.newY },
                { constraint: data.shiftKey, snap: data.ctrlKey },
            );
        },
        onPointerUp() {
            transformHandle?.dispose();
            historyManager.resume();
        },
    };
}
