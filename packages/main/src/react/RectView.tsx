import { type MouseEventHandler, useCallback } from "react";
import type { Rect } from "../model/Rect";
import type { Viewport } from "../model/Viewport";
import { useCanvasEventHandler, useCanvasState } from "./StoreProvider";

export function RectView({
	rect,
	viewport,
}: { rect: Rect; viewport: Viewport }) {
	const state = useCanvasState();
	const handlers = useCanvasEventHandler();

	const canvasWidth = rect.width * viewport.scale;
	const canvasHeight = rect.height * viewport.scale;

	const isLabelEditing = state.isTextEditing(rect.id);

	const handleMouseDown: MouseEventHandler = useCallback(
		(ev) => {
			const handled = handlers.handleShapeMouseDown(
				rect.id,
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
		},
		[rect.id, handlers],
	);

	const handleDoubleClick: MouseEventHandler = useCallback(
		(ev) => {
			const handled = handlers.handleShapeDoubleClick(
				rect.id,
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
		},
		[rect.id, handlers],
	);

	return (
		<div
			css={{
				position: "absolute",
				left: (rect.x - viewport.x) * viewport.scale,
				top: (rect.y - viewport.y) * viewport.scale,
			}}
			onMouseDown={handleMouseDown}
			onDoubleClick={handleDoubleClick}
		>
			<svg
				viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
				width={canvasWidth}
				height={canvasHeight}
				css={{
					overflow: "visible",
					pointerEvents: "none",
				}}
			>
				<title>rect</title>
				<rect
					css={{ pointerEvents: "all" }}
					x={0}
					y={0}
					width={canvasWidth}
					height={canvasHeight}
					strokeWidth={2}
					stroke="#303030"
					fill="#f0f0f0"
				/>
			</svg>
			<div
				css={{
					position: "absolute",
					inset: 0,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					flexDirection: "row",
				}}
			>
				{isLabelEditing ? (
					<textarea
						autoFocus={true}
						autoComplete="off"
						css={{
							fieldSizing: "content",
							border: "none",
							background: "none",
							font: "inherit",
							letterSpacing: "inherit",
							lineHeight: "inherit",
							outline: "none",
							resize: "none",
							whiteSpace: "pre-wrap",
						}}
						onFocus={(ev) => {
							ev.target.setSelectionRange(0, ev.target.value.length);
						}}
						onChange={(ev) =>
							handlers.handleLabelChange(rect.id, ev.target.value)
						}
						onMouseDown={(ev) => {
							ev.stopPropagation();
						}}
						value={rect.label}
					/>
				) : (
					<span
						css={{
							whiteSpace: "pre-wrap",
						}}
					>
						{addPostFix(rect.label)}
					</span>
				)}
			</div>
		</div>
	);
}

const ZERO_WIDTH_SPACE = "\u200b";

function addPostFix(text: string) {
	if (text.endsWith("\n") || text.endsWith("\r")) {
		return text + ZERO_WIDTH_SPACE;
	}
	return text;
}
