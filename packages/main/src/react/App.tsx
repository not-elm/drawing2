import { useEffect } from "react";
import {
	ColorPaletteBackground,
	ColorPaletteBase,
	ColorPaletteMonoColorBackground,
	cssVarBackgroundColorName,
	cssVarBaseColorName,
	cssVarMonoBackgroundColorName,
} from "../model/ColorPaletteBase";
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
				[cssVarBaseColorName(0)]: ColorPaletteBase[0],
				[cssVarBaseColorName(1)]: ColorPaletteBase[1],
				[cssVarBaseColorName(2)]: ColorPaletteBase[2],
				[cssVarBaseColorName(3)]: ColorPaletteBase[3],
				[cssVarBaseColorName(4)]: ColorPaletteBase[4],
				[cssVarBaseColorName(5)]: ColorPaletteBase[5],
				[cssVarBaseColorName(6)]: ColorPaletteBase[6],
				[cssVarBaseColorName(7)]: ColorPaletteBase[7],
				[cssVarBaseColorName(8)]: ColorPaletteBase[8],
				[cssVarBaseColorName(9)]: ColorPaletteBase[9],
				[cssVarBaseColorName(10)]: ColorPaletteBase[10],
				[cssVarBaseColorName(11)]: ColorPaletteBase[11],
				[cssVarBackgroundColorName(0)]: ColorPaletteBackground[0],
				[cssVarBackgroundColorName(1)]: ColorPaletteBackground[1],
				[cssVarBackgroundColorName(2)]: ColorPaletteBackground[2],
				[cssVarBackgroundColorName(3)]: ColorPaletteBackground[3],
				[cssVarBackgroundColorName(4)]: ColorPaletteBackground[4],
				[cssVarBackgroundColorName(5)]: ColorPaletteBackground[5],
				[cssVarBackgroundColorName(6)]: ColorPaletteBackground[6],
				[cssVarBackgroundColorName(7)]: ColorPaletteBackground[7],
				[cssVarBackgroundColorName(8)]: ColorPaletteBackground[8],
				[cssVarBackgroundColorName(9)]: ColorPaletteBackground[9],
				[cssVarBackgroundColorName(10)]: ColorPaletteBackground[10],
				[cssVarBackgroundColorName(11)]: ColorPaletteBackground[11],
				[cssVarMonoBackgroundColorName]: ColorPaletteMonoColorBackground,
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
