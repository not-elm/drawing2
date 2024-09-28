import { memo } from "react";
import { cssVarBaseColor } from "../model/ColorPaletteBase";
import type { Line } from "../model/Line";
import { useCanvasEventHandler } from "./StoreProvider";

export const LineView = memo(function LineView({
	line,
	scale,
}: { line: Line; scale: number }) {
	const handlers = useCanvasEventHandler();

	const canvasX1 = line.x1 * scale;
	const canvasY1 = line.y1 * scale;
	const canvasX2 = line.x2 * scale;
	const canvasY2 = line.y2 * scale;

	const left = Math.min(canvasX1, canvasX2);
	const top = Math.min(canvasY1, canvasY2);
	const width = Math.max(Math.abs(canvasX1 - canvasX2), 1);
	const height = Math.max(Math.abs(canvasY1 - canvasY2), 1);

	return (
		<svg
			viewBox={`0 0 ${width} ${height}`}
			css={{
				position: "absolute",
				pointerEvents: "none",
				left,
				top,
				width,
				height,
				overflow: "visible",
			}}
		>
			<line
				css={{
					stroke: cssVarBaseColor(line.colorId),
				}}
				x1={canvasX1 - left}
				y1={canvasY1 - top}
				x2={canvasX2 - left}
				y2={canvasY2 - top}
				strokeWidth={5}
				strokeLinecap="round"
			/>
			<line
				x1={canvasX1 - left}
				y1={canvasY1 - top}
				x2={canvasX2 - left}
				y2={canvasY2 - top}
				strokeWidth={15}
				strokeLinecap="round"
				css={{
					pointerEvents: "all",
				}}
				onMouseDown={(ev) => {
					const handled = handlers.handleShapeMouseDown(
						line.id,
						ev.clientX,
						ev.clientY,
						ev.button,
						{
							shiftKey: ev.shiftKey,
						},
					);

					if (handled) {
						ev.stopPropagation();
						ev.preventDefault();
					}
				}}
			/>
		</svg>
	);
});
