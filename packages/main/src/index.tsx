import { createRoot } from "react-dom/client";
import { initializeLocalCanvasStateStore } from "./model/LocalCanvasStateStore";
import { App } from "./react/App";
import { ControllerProvider } from "./react/ControllerProvider";
import { StoreProvider } from "./react/StoreProvider";

window.addEventListener("DOMContentLoaded", () => {
	const container = document.getElementById("root");
	if (container === null) {
		alert("Failed to initialize application");
		return;
	}

	const root = createRoot(container);
	root.render(
		<StoreProvider initializeStore={initializeLocalCanvasStateStore}>
			<ControllerProvider>
				<App />
			</ControllerProvider>
		</StoreProvider>,
	);
});
