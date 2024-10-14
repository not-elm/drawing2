import type { HistoryManager } from "./HistoryManager";
import type { PointerEventHandlers } from "./PointerEventSession";
import type { TransformHandle } from "./model/TransformHandle";

export function createTransformSession(
    historyManager: HistoryManager,
    transformHandle: TransformHandle,
): PointerEventHandlers {
    return {
        onPointerDown() {
            historyManager.pause();
        },
        onPointerMove(data) {
            transformHandle?.apply(data.new, {
                constraint: data.shiftKey,
                snap: data.ctrlKey,
            });
        },
        onPointerUp() {
            transformHandle?.dispose();
            historyManager.resume();
        },
    };
}
