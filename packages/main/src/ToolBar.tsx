import styled from "@emotion/styled";
import { useCanvasEventHandler, useCanvasState } from "./StoreProvider";

export function ToolBar() {
	const state = useCanvasState();
	const handlers = useCanvasEventHandler();

	return (
		<ul
			css={{
				background: "#fff",
				border: "1px solid #c0c0c0",
				boxShadow: "0 1px 4px rgba(0, 0, 0, 0.2)",
				padding: "4px 4px",
				borderRadius: "12px",
				listStyle: "none",
				flex: "0 0 auto",
				display: "flex",
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "center",
				gap: 16,
				pointerEvents: "all",
			}}
		>
			<li>
				<Button
					aria-checked={state.mode === "select"}
					onClick={() => {
						handlers.handleModeChange("select");
					}}
				>
					Select
				</Button>
			</li>
			<li>
				<Button
					aria-checked={state.mode === "rect"}
					onClick={() => {
						handlers.handleModeChange("rect");
					}}
				>
					Rect
				</Button>
			</li>
			<li>
				<Button
					aria-checked={state.mode === "line"}
					onClick={() => {
						handlers.handleModeChange("line");
					}}
				>
					Line
				</Button>
			</li>
		</ul>
	);
}

const Button = styled.button({
	display: "flex",
	flexDirection: "row",
	alignItems: "center",
	justifyContent: "center",
	width: "56px",
	height: "56px",
	padding: "8px",
	background: "#fff",
	border: "none",
	borderRadius: "8px",
	cursor: "pointer",
	transition: "background-color 0.2s",
	"&:hover": {
		backgroundColor: "#f0f0f0",
		transition: "background-color none",
	},
	'&[aria-checked="true"]': {
		backgroundColor: "#2568cd",
		color: "#fff",
		transition: "background-color none",
	},
});
