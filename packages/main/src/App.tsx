import type { FC } from "react";
import { Page } from "./model/Page";
import { Rect } from "./model/Rect";

let page = Page.create();
page = Page.addRect(page, Rect.create(100, 200, 300, 400));
page = Page.addRect(page, Rect.create(200, 100, 400, 300));

export const App: FC = () => {
	return (
		<div
			css={{
				position: "fixed",
				inset: 0,
			}}
		>
			{page.rects.map((rect) => (
				<div
					key={JSON.stringify(rect)}
					css={{
						position: "absolute",
						left: rect.x,
						top: rect.y,
						width: rect.width,
						height: rect.height,
						border: "1px solid #000",
						background: "#f0f0f0",
					}}
				/>
			))}
		</div>
	);
};
