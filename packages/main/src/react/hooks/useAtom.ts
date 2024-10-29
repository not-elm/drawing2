import { useSyncExternalStore } from "react";
import type { Atom } from "../../core/atom/Atom";

export function useAtom<T>(atom: Atom<T>): T {
    return useSyncExternalStore(
        (listener) => {
            atom.addListener(listener);
            return () => atom.removeListener(listener);
        },
        () => atom.get(),
    );
}
