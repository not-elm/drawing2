import { LiveList, LiveObject, createClient } from "@liveblocks/client";
import {
	type ReactNode,
	createContext,
	useContext,
	useEffect,
	useState,
	useSyncExternalStore,
} from "react";
import {
	type CanvasEventHandlers,
	type CanvasState,
	CanvasStateStore,
} from "./model/CanvasState";

const context = createContext<CanvasStateStore>(null as never);

export function StoreProvider({ children }: { children?: ReactNode }) {
	const [store, setStore] = useState<CanvasStateStore | null>(null);
	useEffect(() => {
		initializeStore().then((store) => {
			setStore(store);
		});
	}, []);

	if (store === null) {
		return null;
	}

	return <context.Provider value={store}>{children}</context.Provider>;
}

async function initializeStore(): Promise<CanvasStateStore> {
	const client = createClient({
		publicApiKey:
			"pk_dev_C0tQrDQdKR0j4wrQoccD4kiwG7wVf_kCe806sGq6osrUVSWvzljKiiLhCe9yiOZn",
	});

	const { room } = client.enterRoom("my-room", {
		initialStorage: {
			page: new LiveObject({
				rects: new LiveList([]),
				lines: new LiveList([]),
			}),
		},
	});
	const storage = await room.getStorage();
	const store = new CanvasStateStore(room, storage);
	room.subscribe(storage.root, () => store.syncWithLiveBlockStorage(), {
		isDeep: true,
	});
	room.subscribe("storage-status", (status) => {
		if (status === "synchronized") {
			store.syncWithLiveBlockStorage();
		}
	});
	store.syncWithLiveBlockStorage();

	return store;
}

export function useCanvasState(): [CanvasState, CanvasEventHandlers] {
	const store = useContext(context);

	const state = useSyncExternalStore(
		(callback) => {
			store.addListener(callback);
			return () => store.removeListener(callback);
		},
		() => store.getState(),
	);

	return [state, store];
}
