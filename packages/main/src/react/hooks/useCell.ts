import { useSyncExternalStore } from "react";
import type { ICell } from "../../core/cell/ICell";

export function useCell<T>(cell: ICell<T>): T {
    return useSyncExternalStore(
        (listener) => {
            cell.addListener(listener);
            return () => cell.removeListener(listener);
        },
        () => cell.get(),
    );
}
