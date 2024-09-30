import { createRoot } from "react-dom/client";
import { App } from "./react/App";
import { ControllerProvider } from "./react/ControllerProvider";
import { StoreProvider } from "./react/StoreProvider";
import { initializeCanvasStateStore } from "./store/CanvasStateStore";

window.addEventListener("DOMContentLoaded", () => {
	const container = document.getElementById("root");
	if (container === null) {
		alert("Failed to initialize application");
		return;
	}

	const root = createRoot(container);
	root.render(
		<StoreProvider initializeStore={initializeCanvasStateStore}>
			<ControllerProvider>
				<App />
			</ControllerProvider>
		</StoreProvider>,
	);
});
