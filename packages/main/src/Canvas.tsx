import { type WheelEventHandler, useCallback } from "react";
import { type DragState, useDrag } from "./hooks/useDrag";
import { Page } from "./model/Page";
import { Rect } from "./model/Rect";
import type { Viewport } from "./model/Viewport";

let page = Page.create();
page = Page.addRect(page, Rect.create(100, 200, 300, 400));
page = Page.addRect(page, Rect.create(200, 100, 400, 300));

export function Canvas({
	page,
	viewport,
	onScroll,
	onScale,
}: {
	page: Page;
	viewport: Viewport;
	onScroll: (deltaX: number, deltaY: number) => void;
	/**
	 * Called when the user scales the canvas.
	 * @param scale
	 * @param centerX The x coordinate of the center of the scale operation in canvas coordinate.
	 * @param centerY The y coordinate of the center of the scale operation in canvas coordinate
	 */
	onScale: (scale: number, centerX: number, centerY: number) => void;
}) {
	const { containerRef, state } = useDrag({
		onDragEnd: (state) => {
			const width = Math.abs(state.currentX - state.startX);
			const height = Math.abs(state.currentY - state.startY);

			const x = Math.min(state.startX, state.currentX);
			const y = Math.min(state.startY, state.currentY);

			page = Page.addRect(page, Rect.create(x, y, width, height));
		},
	});

	const handleWheel: WheelEventHandler = useCallback(
		(ev) => {
			if (ev.ctrlKey) {
				onScale(viewport.scale - ev.deltaY * 0.001, ev.clientX, ev.clientY);
			} else {
				onScroll(ev.deltaX, ev.deltaY);
			}
		},
		[onScroll, onScale, viewport.scale],
	);

	return (
		<div
			ref={containerRef}
			css={{
				position: "fixed",
				inset: 0,
			}}
			onWheel={handleWheel}
		>
			{page.rects.map((rect) => (
				<div
					key={JSON.stringify(rect)}
					css={{
						position: "absolute",
						left: (rect.x - viewport.x) * viewport.scale,
						top: (rect.y - viewport.y) * viewport.scale,
						width: rect.width * viewport.scale,
						height: rect.height * viewport.scale,
						border: "1px solid #000",
						background: "#f0f0f0",
					}}
				/>
			))}

			<RectPreview dragState={state} />
		</div>
	);
}

function RectPreview({ dragState }: { dragState: DragState }) {
	if (!dragState.dragging) return null;

	const width = Math.abs(dragState.currentX - dragState.startX);
	const height = Math.abs(dragState.currentY - dragState.startY);
	const x = Math.min(dragState.startX, dragState.currentX);
	const y = Math.min(dragState.startY, dragState.currentY);

	return (
		<div
			css={{
				position: "absolute",
				left: x,
				top: y,
				width,
				height,
				border: "1px dashed #000",
				background: "#f0f0f0",
			}}
		/>
	);
}
