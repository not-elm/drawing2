import {
	LiveList,
	LiveMap,
	LiveObject,
	createClient,
} from "@liveblocks/client";
import {
	type ReactNode,
	createContext,
	useContext,
	useEffect,
	useState,
	useSyncExternalStore,
} from "react";
import type { CanvasState } from "../model/CanvasState";
import { CanvasStateStore } from "../model/CanvasStateStore";
import type { Line } from "../model/Line";
import type { Shape } from "../model/Shape";
import { Controller } from "../service/Controller";
import { getRestoreViewportService } from "../service/RestoreViewportService";

const context = createContext<{
	store: CanvasStateStore;
	controller: Controller;
}>(null as never);

export function StoreProvider({ children }: { children?: ReactNode }) {
	const [state, setState] = useState<{
		store: CanvasStateStore;
		controller: Controller;
	} | null>(null);
	useEffect(() => {
		initializeStore().then((store) => {
			const controller = new Controller(store);
			setState({ store, controller });
		});
	}, []);

	if (state === null) {
		return null;
	}

	return <context.Provider value={state}>{children}</context.Provider>;
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
				objectIds: new LiveList<string>([]),
				schemaUpdatedAt: 0,
			}),
		},
	});
	const storage = await room.getStorage();
	const store = new CanvasStateStore(
		{
			resumeHistory() {
				room.history.resume();
			},
			pauseHistory() {
				room.history.pause();
			},
			undo() {
				room.history.undo();
			},
			redo() {
				room.history.redo();
			},
			batch(callback: () => void) {
				room.batch(callback);
			},
		},
		storage,
		getRestoreViewportService(),
	);
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
	const { store } = useContext(context);

	return useSyncExternalStore(
		(callback) => {
			store.addListener(callback);
			return () => store.removeListener(callback);
		},
		() => store.getState(),
	);
}

export function useCanvasEventHandler(): Controller {
	return useContext(context).controller;
}
