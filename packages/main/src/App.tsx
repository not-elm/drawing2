import { useState } from "react";
import { Canvas } from "./Canvas";
import { ToolBar } from "./ToolBar";
import { Page } from "./model/Page";
import type { ToolMode } from "./model/ToolMode";

export function App() {
	const [mode, setMode] = useState<ToolMode>("rect");
	const [page, setPage] = useState(() => Page.create());

	const [viewport, setViewport] = useState(() => ({
		x: 0,
		y: 0,
		scale: 1,
	}));

	return (
		<div
			css={{
				position: "fixed",
				inset: 0,
			}}
		>
			<Canvas
				toolMode={mode}
				page={page}
				viewport={viewport}
				onAddRect={(rect) => {
					setPage((oldPage) => Page.addRect(oldPage, rect));
				}}
				onAddLine={(line) => {
					setPage((oldPage) => Page.addLine(oldPage, line));
				}}
				onScroll={(deltaX, deltaY) => {
					setViewport((oldState) => ({
						...oldState,
						x: oldState.x + deltaX,
						y: oldState.y + deltaY,
					}));
				}}
				onScale={(scale, centerX, centerY) => {
					setViewport((oldState) => {
						const x = centerX / oldState.scale - centerX / scale + oldState.x;
						const y = centerY / oldState.scale - centerY / scale + oldState.y;

						return { x, y, scale };
					});
				}}
			/>
			<div
				css={{
					position: "absolute",
					width: "100%",
					bottom: 64,
					display: "flex",
					flexDirection: "row",
					justifyContent: "center",
				}}
			>
				<ToolBar mode={mode} onModeChange={(mode) => setMode(mode)} />
			</div>
		</div>
	);
}
