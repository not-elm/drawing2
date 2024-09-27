import type { ButtonHTMLAttributes } from "react";
import type { ToolMode } from "./model/ToolMode";

export function ToolBar({
	mode,
	onModeChange,
}: { mode: ToolMode; onModeChange: (mode: ToolMode) => void }) {
	return (
		<ul
			css={{
				listStyle: "none",
				flex: "0 0 auto",
				display: "flex",
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "center",
				gap: 16,
			}}
		>
			<li>
				<Button
					aria-checked={mode === "select"}
					onClick={() => {
						onModeChange("select");
					}}
				>
					Select
				</Button>
			</li>
			<li>
				<Button
					aria-checked={mode === "rect"}
					onClick={() => {
						onModeChange("rect");
					}}
				>
					Rect
				</Button>
			</li>
			<li>
				<Button
					aria-checked={mode === "line"}
					onClick={() => {
						onModeChange("line");
					}}
				>
					Line
				</Button>
			</li>
		</ul>
	);
}

function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button
			{...props}
			type="button"
			css={{
				'&[aria-checked="true"]': {
					backgroundColor: "rgba(0, 0, 0, 0.1)",
				},
			}}
		/>
	);
}
