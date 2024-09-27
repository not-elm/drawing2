import { useState } from "react";
import { Canvas } from "./Canvas";
import { Page } from "./model/Page";
import { Rect } from "./model/Rect";

let page = Page.create();
page = Page.addRect(page, Rect.create(100, 200, 300, 400));
page = Page.addRect(page, Rect.create(200, 100, 400, 300));

export function App() {
	const [viewport, setViewport] = useState(() => ({
		x: 0,
		y: 0,
		scale: 1,
	}));

	return (
		<Canvas
			page={page}
			viewport={viewport}
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
	);
}
