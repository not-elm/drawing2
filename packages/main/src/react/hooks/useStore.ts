import { useSyncExternalStore } from "react";
import type { Store } from "../../lib/Store";

export function useStore<T>(store: Store<T>) {
	return useSyncExternalStore(
		(callback) => {
			store.addListener(callback);
			return () => store.removeListener(callback);
		},
		() => store.getState(),
	);
}
