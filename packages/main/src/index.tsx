import { LiveList, LiveObject } from "@liveblocks/client";
import {
	ClientSideSuspense,
	LiveblocksProvider,
	RoomProvider,
} from "@liveblocks/react/suspense";
import { createRoot } from "react-dom/client";
import { App } from "./App";

window.addEventListener("DOMContentLoaded", () => {
	const container = document.getElementById("root");
	if (container === null) {
		alert("Failed to initialize application");
		return;
	}

	const root = createRoot(container);
	root.render(
		<LiveblocksProvider publicApiKey="pk_dev_C0tQrDQdKR0j4wrQoccD4kiwG7wVf_kCe806sGq6osrUVSWvzljKiiLhCe9yiOZn">
			<RoomProvider
				id="my-room"
				initialStorage={{
					page: new LiveObject({
						rects: new LiveList([]),
						lines: new LiveList([]),
					}),
				}}
			>
				<ClientSideSuspense fallback={<div>Loading…</div>}>
					<App />
				</ClientSideSuspense>
			</RoomProvider>
		</LiveblocksProvider>,
	);
});
