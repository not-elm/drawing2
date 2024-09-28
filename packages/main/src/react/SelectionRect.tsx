import styled from "@emotion/styled";
import type { Rect } from "../model/Rect";
import type { Viewport } from "../model/Viewport";
import { useCanvasEventHandler } from "./StoreProvider";

export function SelectionRect({
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
