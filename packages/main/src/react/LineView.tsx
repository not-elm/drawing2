import { toCanvasCoordinate } from "../model/CanvasStateStore";
import { cssVarBaseColor } from "../model/ColorPaletteBase";
import type { Line } from "../model/Line";
import type { Viewport } from "../model/Viewport";
import { useCanvasEventHandler } from "./StoreProvider";

export function LineView({
	line,
	viewport,
}: { line: Line; viewport: Viewport }) {
	const handlers = useCanvasEventHandler();

	const [canvasX1, canvasY1] = toCanvasCoordinate(line.x1, line.y1, viewport);
	const [canvasX2, canvasY2] = toCanvasCoordinate(line.x2, line.y2, viewport);

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
			<title>line</title>
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
}
