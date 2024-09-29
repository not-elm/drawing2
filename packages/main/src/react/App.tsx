import { useEffect } from "react";
import { Canvas } from "./Canvas";
import { useController } from "./ControllerProvider";
import { PropertyPanel } from "./PropertyPanel/PropertyPanel";
import { ToolBar } from "./ToolBar";

export function App() {
	const handlers = useController();

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
				"--color-ui-primary": "#2568cd",
				"--color-ui-selected": "var(--color-ui-primary)",
				"--color-selection": "var(--color-ui-primary)",
			}}
		>
			<Canvas />
			<div
				css={{
					position: "absolute",
					width: "100%",
					bottom: 12,
					left: 12,
					right: 12,
					display: "flex",
					flexDirection: "row",
					justifyContent: "center",
					pointerEvents: "none",
				}}
			>
				<ToolBar />
			</div>
			<div
				css={{
					position: "absolute",
					top: 12,
					right: 12,
					bottom: 12,
					display: "flex",
					flexDirection: "column",
					alignItems: "flex-start",
					pointerEvents: "none",
				}}
			>
				<PropertyPanel />
			</div>
		</div>
	);
}
