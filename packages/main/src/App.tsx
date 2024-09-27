import { useEffect } from "react";
import { Canvas } from "./Canvas";
import { useCanvasEventHandler, useCanvasState } from "./StoreProvider";
import { ToolBar } from "./ToolBar";

export function App() {
	const state = useCanvasState();
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
			<Canvas
				state={state}
				onCanvasMouseDown={(canvasX, canvasY) =>
					handlers.handleCanvasMouseDown(canvasX, canvasY)
				}
				onCanvasMouseMove={(canvasX, canvasY) =>
					handlers.handleCanvasMouseMove(canvasX, canvasY)
				}
				onCanvasMouseUp={() => handlers.handleCanvasMouseUp()}
				onRectMouseDown={(rect, canvasX, canvasY) =>
					handlers.handleRectMouseDown(rect, canvasX, canvasY)
				}
				onScroll={(deltaCanvasX, deltaCanvasY) =>
					handlers.handleScroll(deltaCanvasX, deltaCanvasY)
				}
				onScale={(scale, centerCanvasX, centerCanvasY) =>
					handlers.handleScale(scale, centerCanvasX, centerCanvasY)
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
					onModeChange={(mode) => handlers.handleModeChange(mode)}
				/>
			</div>
		</div>
	);
}
