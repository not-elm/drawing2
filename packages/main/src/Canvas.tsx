import styled from "@emotion/styled";
import {
	type MouseEventHandler,
	type WheelEventHandler,
	useCallback,
	useEffect,
	useMemo,
} from "react";
import { useCanvasEventHandler, useCanvasState } from "./StoreProvider";
import { isNotNullish } from "./lib/isNullish";
import {
	type CanvasState,
	computeUnionRect,
	toCanvasCoordinate,
} from "./model/CanvasState";
import { Line } from "./model/Line";
import { Rect } from "./model/Rect";
import type { Viewport } from "./model/Viewport";

export function Canvas() {
	const state = useCanvasState();
	const handlers = useCanvasEventHandler();

	useEffect(() => {
		function handleMouseMove(ev: MouseEvent) {
			handlers.handleCanvasMouseMove(ev.clientX, ev.clientY);
		}
		function handleMouseUp() {
			handlers.handleCanvasMouseUp();
		}
		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, [handlers]);

	const handleWheel: WheelEventHandler = useCallback(
		(ev) => {
			if (ev.ctrlKey) {
				handlers.handleScale(
					Math.min(Math.max(0.1, state.viewport.scale - ev.deltaY * 0.0005), 4),
					ev.clientX,
					ev.clientY,
				);
			} else {
				handlers.handleScroll(ev.deltaX, ev.deltaY);
			}
		},
		[handlers, state.viewport.scale],
	);

	const handleCanvasMouseDown: MouseEventHandler = useCallback(
		(ev) => {
			ev.stopPropagation();
			ev.preventDefault();
			handlers.handleCanvasMouseDown(ev.clientX, ev.clientY, {
				shiftKey: ev.shiftKey,
			});
		},
		[handlers],
	);

	return (
		<div
			css={{
				position: "fixed",
				inset: 0,
			}}
			onWheel={handleWheel}
			onMouseDown={handleCanvasMouseDown}
		>
			{state.page.rects.map((rect) => (
				<RectView
					key={JSON.stringify(rect)}
					rect={rect}
					viewport={state.viewport}
					onMouseDown={
						state.mode === "select"
							? (ev) => {
									ev.stopPropagation();
									ev.preventDefault();
									handlers.handleShapeMouseDown(
										rect.id,
										ev.clientX,
										ev.clientY,
										{
											shiftKey: ev.shiftKey,
										},
									);
								}
							: undefined
					}
				/>
			))}
			{state.page.lines.map((line) => (
				<LineView
					key={JSON.stringify(line)}
					line={line}
					viewport={state.viewport}
				/>
			))}

			<ToolPreview />
			<SelectionRectView />
			<SelectionView />
		</div>
	);
}

function RectView({
	rect,
	viewport,
	onMouseDown,
}: { rect: Rect; viewport: Viewport; onMouseDown?: MouseEventHandler }) {
	return (
		<div
			onMouseDown={onMouseDown}
			css={{
				position: "absolute",
				left: (rect.x - viewport.x) * viewport.scale,
				top: (rect.y - viewport.y) * viewport.scale,
				width: rect.width * viewport.scale,
				height: rect.height * viewport.scale,
				border: "2px solid #303030",
				borderRadius: "4px",
				background: "#f0f0f0",
				boxSizing: "border-box",
			}}
		/>
	);
}

function LineView({ line, viewport }: { line: Line; viewport: Viewport }) {
	const handlers = useCanvasEventHandler();

	const [canvasX1, canvasY1] = toCanvasCoordinate(line.x1, line.y1, viewport);
	const [canvasX2, canvasY2] = toCanvasCoordinate(line.x2, line.y2, viewport);

	const left = Math.min(canvasX1, canvasX2);
	const top = Math.min(canvasY1, canvasY2);
	const width = Math.abs(canvasX1 - canvasX2);
	const height = Math.abs(canvasY1 - canvasY2);

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
				x1={canvasX1 - left}
				y1={canvasY1 - top}
				x2={canvasX2 - left}
				y2={canvasY2 - top}
				stroke="#000"
				strokeWidth={1}
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
					ev.stopPropagation();
					ev.preventDefault();
					handlers.handleShapeMouseDown(line.id, ev.clientX, ev.clientY, {
						shiftKey: ev.shiftKey,
					});
				}}
			/>
		</svg>
	);
}

function ToolPreview() {
	const state = useCanvasState();

	if (!state.dragging) return null;

	switch (state.mode) {
		case "rect":
			return <RectToolPreview />;
		case "line":
			return <LineToolPreview state={state} />;
	}
}

function RectToolPreview() {
	const state = useCanvasState();

	const width = Math.abs(state.dragCurrentX - state.dragStartX);
	const height = Math.abs(state.dragCurrentY - state.dragStartY);
	const x = Math.min(state.dragStartX, state.dragCurrentX);
	const y = Math.min(state.dragStartY, state.dragCurrentY);

	const rect = Rect.create(x, y, width, height);

	return <RectView rect={rect} viewport={state.viewport} />;
}

function LineToolPreview({ state }: { state: CanvasState }) {
	const line = Line.create(
		state.dragStartX,
		state.dragStartY,
		state.dragCurrentX,
		state.dragCurrentY,
	);

	return <LineView line={line} viewport={state.viewport} />;
}

function SelectionRectView() {
	const state = useCanvasState();

	if (state.selectionRect === null) return null;

	return (
		<div
			css={{
				position: "absolute",
				inset: 0,
				pointerEvents: "none",
			}}
		>
			<div
				css={{
					position: "absolute",
					left:
						(state.selectionRect.x - state.viewport.x) * state.viewport.scale,
					top:
						(state.selectionRect.y - state.viewport.y) * state.viewport.scale,
					width: state.selectionRect.width * state.viewport.scale,
					height: state.selectionRect.height * state.viewport.scale,
					// border: "2px dashed #303030",
					// boxSizing: "border-box",
					background: "rgba(40, 40 ,40, 0.1)",
				}}
			/>
		</div>
	);
}

function SelectionView() {
	const state = useCanvasState();

	const selectionRect = useMemo(
		() =>
			computeUnionRect(
				state.selectedShapeIds
					.map((id) => state.page.rects.find((r) => r.id === id))
					.filter(isNotNullish),
				state.selectedShapeIds
					.map((id) => state.page.lines.find((r) => r.id === id))
					.filter(isNotNullish),
			),
		[state.selectedShapeIds, state.page.rects, state.page.lines],
	);
	if (selectionRect === null) return null;
	const rects = state.selectedShapeIds
		.map((id) => state.page.rects.find((r) => r.id === id))
		.filter(isNotNullish);

	return (
		<div
			css={{
				position: "absolute",
				inset: 0,
				pointerEvents: "none",
			}}
		>
			<SelectionRect
				x={selectionRect.x}
				y={selectionRect.y}
				width={selectionRect.width}
				height={selectionRect.height}
				rects={rects}
				viewport={state.viewport}
			/>
		</div>
	);
}

function SelectionRect({
	x,
	y,
	width,
	height,
	rects,
	viewport,
}: {
	x: number;
	y: number;
	width: number;
	height: number;
	rects: Rect[];
	viewport: Viewport;
}) {
	const handlers = useCanvasEventHandler();

	return (
		<div
			css={{
				"--color-selection": "#2568cd",
				position: "absolute",
				left: (x - viewport.x) * viewport.scale,
				top: (y - viewport.y) * viewport.scale,
				width: width * viewport.scale,
				height: height * viewport.scale,
				pointerEvents: "none",
			}}
		>
			<div
				css={{
					position: "absolute",
					inset: 0,
					boxSizing: "border-box",
					outline: "2px solid var(--color-selection)",
					pointerEvents: "all",
				}}
				onMouseDown={(ev) => {
					ev.stopPropagation();
					ev.preventDefault();
					handlers.handleSelectionHandleMouseDown(
						ev.clientX,
						ev.clientY,
						"center",
					);
				}}
			/>
			{rects.map((rect) => (
				<div
					key={rect.id}
					css={{
						position: "absolute",
						left: (rect.x - x) * viewport.scale,
						top: (rect.y - y) * viewport.scale,
						width: rect.width * viewport.scale,
						height: rect.height * viewport.scale,
						boxSizing: "border-box",
						border: "1px solid var(--color-selection)",
						pointerEvents: "all",
					}}
					onMouseDown={(ev) => {
						ev.stopPropagation();
						ev.preventDefault();
						handlers.handleShapeMouseDown(rect.id, ev.clientX, ev.clientY, {
							shiftKey: ev.shiftKey,
						});
					}}
				/>
			))}
			<ResizeHandle
				css={{ top: "0%", left: "0%", width: "100%", cursor: "ns-resize" }}
				onMouseDown={(ev) => {
					ev.stopPropagation();
					ev.preventDefault();
					handlers.handleSelectionHandleMouseDown(
						ev.clientX,
						ev.clientY,
						"top",
					);
				}}
			/>
			<ResizeHandle
				css={{ top: "0%", left: "100%", height: "100%", cursor: "ew-resize" }}
				onMouseDown={(ev) => {
					ev.stopPropagation();
					ev.preventDefault();
					handlers.handleSelectionHandleMouseDown(
						ev.clientX,
						ev.clientY,
						"right",
					);
				}}
			/>
			<ResizeHandle
				css={{ top: "100%", left: "0%", width: "100%", cursor: "ns-resize" }}
				onMouseDown={(ev) => {
					ev.stopPropagation();
					ev.preventDefault();
					handlers.handleSelectionHandleMouseDown(
						ev.clientX,
						ev.clientY,
						"bottom",
					);
				}}
			/>
			<ResizeHandle
				css={{ top: "0%", left: "0%", height: "100%", cursor: "ew-resize" }}
				onMouseDown={(ev) => {
					ev.stopPropagation();
					ev.preventDefault();
					handlers.handleSelectionHandleMouseDown(
						ev.clientX,
						ev.clientY,
						"left",
					);
				}}
			/>

			<ResizeHandle
				css={{ top: "0%", left: "0%", cursor: "nwse-resize" }}
				onMouseDown={(ev) => {
					ev.stopPropagation();
					ev.preventDefault();
					handlers.handleSelectionHandleMouseDown(
						ev.clientX,
						ev.clientY,
						"topLeft",
					);
				}}
			>
				<CornerResizeHandle />
			</ResizeHandle>
			<ResizeHandle
				css={{ top: "0%", left: "100%", cursor: "nesw-resize" }}
				onMouseDown={(ev) => {
					ev.stopPropagation();
					ev.preventDefault();
					handlers.handleSelectionHandleMouseDown(
						ev.clientX,
						ev.clientY,
						"topRight",
					);
				}}
			>
				<CornerResizeHandle />
			</ResizeHandle>
			<ResizeHandle
				css={{ top: "100%", left: "100%", cursor: "nwse-resize" }}
				onMouseDown={(ev) => {
					ev.stopPropagation();
					ev.preventDefault();
					handlers.handleSelectionHandleMouseDown(
						ev.clientX,
						ev.clientY,
						"bottomRight",
					);
				}}
			>
				<CornerResizeHandle />
			</ResizeHandle>
			<ResizeHandle
				css={{ top: "100%", left: "0%", cursor: "nesw-resize" }}
				onMouseDown={(ev) => {
					ev.stopPropagation();
					ev.preventDefault();
					handlers.handleSelectionHandleMouseDown(
						ev.clientX,
						ev.clientY,
						"bottomLeft",
					);
				}}
			>
				<CornerResizeHandle />
			</ResizeHandle>
		</div>
	);
}

const ResizeHandle = styled.div({
	position: "absolute",
	transform: "translate(-8px, -8px)",
	minWidth: "16px",
	minHeight: "16px",
	pointerEvents: "all",
});

const CornerResizeHandle = styled.div({
	background: "#fff",
	outline: "2px solid var(--color-selection)",
	boxSizing: "border-box",
	position: "absolute",
	transform: "translate(-50%, -50%)",
	top: "50%",
	left: "50%",
	minWidth: "8px",
	minHeight: "8px",
	pointerEvents: "all",
});
