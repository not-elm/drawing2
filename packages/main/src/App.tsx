import { LiveObject } from "@liveblocks/client";
import { useStorage } from "@liveblocks/react";
import { useMutation } from "@liveblocks/react/suspense";
import { useState } from "react";
import { Canvas } from "./Canvas";
import { ToolBar } from "./ToolBar";
import type { Line } from "./model/Line";
import type { Rect } from "./model/Rect";
import type { ToolMode } from "./model/ToolMode";

export function App() {
	const [mode, setMode] = useState<ToolMode>("rect");
	const page = useStorage((root) => root.page);
	const [viewport, setViewport] = useState(() => ({
		x: 0,
		y: 0,
		scale: 1,
	}));

	const addRect = useMutation(({ storage }, rect: Rect) => {
		const page = storage.get("page");
		const rects = page.get("rects");
		rects.push(new LiveObject(rect));
	}, []);

	const addLine = useMutation(({ storage }, line: Line) => {
		const page = storage.get("page");
		const lines = page.get("lines");
		lines.push(new LiveObject(line));
	}, []);

	if (page === null) {
		return <div>Page is null</div>;
	}
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
				onAddRect={(rect) => addRect(rect)}
				onAddLine={(line) => addLine(line)}
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
