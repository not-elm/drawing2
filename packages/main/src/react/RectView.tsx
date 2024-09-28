import type { MouseEventHandler } from "react";
import type { Rect } from "../model/Rect";
import type { Viewport } from "../model/Viewport";

export function RectView({
	rect,
	viewport,
	onMouseDown,
}: { rect: Rect; viewport: Viewport; onMouseDown?: MouseEventHandler }) {
	const canvasWidth = rect.width * viewport.scale;
	const canvasHeight = rect.height * viewport.scale;

	return (
		<svg
			viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
			width={canvasWidth}
			height={canvasHeight}
			css={{
				position: "absolute",
				left: (rect.x - viewport.x) * viewport.scale,
				top: (rect.y - viewport.y) * viewport.scale,
				overflow: "visible",
				pointerEvents: "none",
			}}
		>
			<title>rect</title>
			<rect
				css={{ pointerEvents: "all" }}
				onMouseDown={onMouseDown}
				x={0}
				y={0}
				width={canvasWidth}
				height={canvasHeight}
				strokeWidth={2}
				stroke="#303030"
				fill="#f0f0f0"
			/>
		</svg>
	);
}
