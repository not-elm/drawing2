import styled from "@emotion/styled";
import { Card } from "./Card";
import { useCanvasEventHandler, useCanvasState } from "./StoreProvider";

export function ToolBar() {
	const state = useCanvasState();
	const handlers = useCanvasEventHandler();

	return (
		<Card>
			<ul
				css={{
					padding: 0,
					margin: 0,
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
						aria-checked={state.mode === "shape"}
						onClick={() => {
							handlers.handleModeChange("shape");
						}}
					>
						Shape
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
		</Card>
	);
}

const Button = styled.button({
	display: "flex",
	flexDirection: "row",
	alignItems: "center",
	justifyContent: "center",
	width: "48px",
	height: "48px",
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
		backgroundColor: "var(--color-ui-selected)",
		color: "#fff",
		transition: "background-color none",
	},
});
