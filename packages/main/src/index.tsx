import { createRoot } from "react-dom/client";
import { App } from "./react/App";
import { CanvasStateStoreProvider } from "./react/CanvasStateStoreProvider";
import { ControllerProvider } from "./react/ControllerProvider";
import { initializeCanvasStateStore } from "./store/CanvasStateStore";

window.addEventListener("DOMContentLoaded", () => {
	const container = document.getElementById("root");
	if (container === null) {
		alert("Failed to initialize application");
		return;
	}

	const root = createRoot(container);
	root.render(
		<CanvasStateStoreProvider initializeStore={initializeCanvasStateStore}>
			<ControllerProvider>
				<App />
			</ControllerProvider>
		</CanvasStateStoreProvider>,
	);
});
