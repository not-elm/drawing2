import { LiveMap, LiveObject, createClient } from "@liveblocks/client";
import {
	type ReactNode,
	createContext,
	useContext,
	useEffect,
	useState,
	useSyncExternalStore,
} from "react";
import type { CanvasState } from "../model/CanvasState";
import {
	type CanvasEventHandlers,
	CanvasStateStore,
} from "../model/CanvasStateStore";
import type { Line } from "../model/Line";
import type { Shape } from "../model/Shape";

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
				shapes: new LiveMap<string, LiveObject<Shape>>(),
				lines: new LiveMap<string, LiveObject<Line>>(),
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

export function useCanvasEventHandler(): CanvasEventHandlers {
	return useContext(context);
}
