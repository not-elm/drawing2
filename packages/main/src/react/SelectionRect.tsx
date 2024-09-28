import styled from "@emotion/styled";
import { isNotNullish } from "../lib/isNullish";
import { useCanvasEventHandler, useCanvasState } from "./StoreProvider";

export function SelectionRect() {
	const state = useCanvasState();
	const handlers = useCanvasEventHandler();
	const selectionRect = state.selectionRect;
	if (selectionRect === null) return null;

	const { x, y, width, height } = selectionRect;
	const rects = state.selectedShapeIds
		.map((id) => state.page.rects.get(id))
		.filter(isNotNullish);

	return (
		<div
			css={{
				"--color-selection": "#2568cd",
				position: "absolute",
				left: (x - state.viewport.x) * state.viewport.scale,
				top: (y - state.viewport.y) * state.viewport.scale,
				width: width * state.viewport.scale,
				height: height * state.viewport.scale,
				pointerEvents: "none",
			}}
		>
			<div
				css={{
					position: "absolute",
					inset: 0,
					boxSizing: "border-box",
					outline: "2px solid var(--color-selection)",
				}}
			/>
			{rects.map((rect) => (
				<div
					key={rect.id}
					css={{
						position: "absolute",
						left: (rect.x - x) * state.viewport.scale,
						top: (rect.y - y) * state.viewport.scale,
						width: rect.width * state.viewport.scale,
						height: rect.height * state.viewport.scale,
						boxSizing: "border-box",
						border: "1px solid var(--color-selection)",
					}}
				/>
			))}
			{state.mode === "select" && (
				<>
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
						css={{
							top: "0%",
							left: "100%",
							height: "100%",
							cursor: "ew-resize",
						}}
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
						css={{
							top: "100%",
							left: "0%",
							width: "100%",
							cursor: "ns-resize",
						}}
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
				</>
			)}
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
