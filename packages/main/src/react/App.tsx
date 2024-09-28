import { useEffect } from "react";
import { Canvas } from "./Canvas";
import { useCanvasEventHandler } from "./StoreProvider";
import { ToolBar } from "./ToolBar";

export function App() {
	const handlers = useCanvasEventHandler();

	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			const isHandled = handlers.handleKeyDown(event.key, {
				metaKey: event.metaKey,
				ctrlKey: event.ctrlKey,
				shiftKey: event.shiftKey,
			});

			if (isHandled) {
				event.preventDefault();
			}
		}
		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [handlers]);

	return (
		<div
			css={{
				position: "fixed",
				inset: 0,
			}}
		>
			<Canvas />
			<div
				css={{
					position: "absolute",
					width: "100%",
					bottom: 24,
					display: "flex",
					flexDirection: "row",
					justifyContent: "center",
					pointerEvents: "none",
				}}
			>
				<ToolBar />
			</div>
		</div>
	);
}
