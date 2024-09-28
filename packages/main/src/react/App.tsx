import { useEffect } from "react";
import { ColorPalette, cssVarBaseColorName } from "../model/ColorPalette";
import { Canvas } from "./Canvas";
import { PropertyPanel } from "./PropertyPanel/PropertyPanel";
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
				"--color-ui-primary": "#2568cd",
				"--color-ui-selected": "var(--color-ui-primary)",
				"--color-selection": "var(--color-ui-primary)",
				[cssVarBaseColorName(0)]: ColorPalette[0],
				[cssVarBaseColorName(1)]: ColorPalette[1],
				[cssVarBaseColorName(2)]: ColorPalette[2],
				[cssVarBaseColorName(3)]: ColorPalette[3],
				[cssVarBaseColorName(4)]: ColorPalette[4],
				[cssVarBaseColorName(5)]: ColorPalette[5],
				[cssVarBaseColorName(6)]: ColorPalette[6],
				[cssVarBaseColorName(7)]: ColorPalette[7],
				[cssVarBaseColorName(8)]: ColorPalette[8],
				[cssVarBaseColorName(9)]: ColorPalette[9],
				[cssVarBaseColorName(10)]: ColorPalette[10],
				[cssVarBaseColorName(11)]: ColorPalette[11],
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
