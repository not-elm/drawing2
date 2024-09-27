import { useEffect, useSyncExternalStore } from "react";
import { Canvas } from "./Canvas";
import { ToolBar } from "./ToolBar";
import { store } from "./model/CanvasState";

function useCanvasState() {
	return useSyncExternalStore(
		(callback) => {
			store.addListener(callback);
			return () => store.removeListener(callback);
		},
		() => store.getState(),
	);
}

export function App() {
	const state = useCanvasState();

	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			switch (event.key) {
				case "z": {
					if (event.metaKey || event.ctrlKey) {
						event.preventDefault();
						if (event.shiftKey) {
							store.redo();
						} else {
							store.undo();
						}
					}
					break;
				}
				case "Delete":
				case "Backspace": {
					store.deleteSelectedShape();
				}
			}
		}

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, []);

	return (
		<div
			css={{
				position: "fixed",
				inset: 0,
			}}
		>
			<Canvas
				state={state}
				onCanvasMouseDown={(canvasX, canvasY) =>
					store.handleCanvasMouseDown(canvasX, canvasY)
				}
				onCanvasMouseMove={(canvasX, canvasY) =>
					store.handleCanvasMouseMove(canvasX, canvasY)
				}
				onCanvasMouseUp={() => store.handleCanvasMouseUp()}
				onRectMouseDown={(rect) => store.selectShape(rect.id)}
				onScroll={(deltaCanvasX, deltaCanvasY) =>
					store.moveViewportPosition(deltaCanvasX, deltaCanvasY)
				}
				onScale={(scale, centerCanvasX, centerCanvasY) =>
					store.setViewportScale(scale, centerCanvasX, centerCanvasY)
				}
			/>
			<div
				css={{
					position: "absolute",
					width: "100%",
					bottom: 64,
					display: "flex",
					flexDirection: "row",
					justifyContent: "center",
				}}
			>
				<ToolBar
					mode={state.mode}
					onModeChange={(mode) => store.setMode(mode)}
				/>
			</div>
		</div>
	);
}
