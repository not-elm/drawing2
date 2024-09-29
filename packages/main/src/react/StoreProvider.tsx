import {
	type ReactNode,
	createContext,
	useContext,
	useEffect,
	useState,
	useSyncExternalStore,
} from "react";
import type { CanvasState } from "../model/CanvasState";
import type { CanvasStateStore } from "../model/CanvasStateStore";

const context = createContext<CanvasStateStore>(null as never);

export function StoreProvider({
	initializeStore,
	children,
}: {
	initializeStore: () => Promise<CanvasStateStore>;
	children?: ReactNode;
}) {
	const [state, setState] = useState<CanvasStateStore | null>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		initializeStore().then((store) => setState(store));
	}, []);

	if (state === null) {
		return null;
	}

	return <context.Provider value={state}>{children}</context.Provider>;
}

export function useCanvasState(): CanvasState {
	const store = useContext(context);

	return useSyncExternalStore(
		(callback) => {
			store.addListener(callback);
			return () => store.removeListener(callback);
		},
		() => store.getState(),
	);
}

export function useCanvasStateStore(): CanvasStateStore {
	return useContext(context);
}
