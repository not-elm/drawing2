import { type MouseEventHandler, useCallback } from "react";
import { type ColorId, Colors } from "../../model/Colors";
import { CardSection } from "../Card";
import { useController } from "../ControllerProvider";
import { useCanvasState } from "../StoreProvider";

export function ColorSection() {
	return (
		<CardSection
			css={{ display: "flex", flexDirection: "row", justifyContent: "center" }}
		>
			<div
				css={{
					position: "relative",
					display: "grid",
					gap: 4,
					gridTemplateColumns: "repeat(4, 1fr)",
					gridTemplateRows: "repeat(3, 1fr)",
				}}
			>
				<ColorButton colorId={0} />
				<ColorButton colorId={1} />
				<ColorButton colorId={2} />
				<ColorButton colorId={3} />
				<ColorButton colorId={4} />
				<ColorButton colorId={5} />
				<ColorButton colorId={6} />
				<ColorButton colorId={7} />
				<ColorButton colorId={8} />
				<ColorButton colorId={9} />
				<ColorButton colorId={10} />
				<ColorButton colorId={11} />
			</div>
		</CardSection>
	);
}

function ColorButton({ colorId }: { colorId: ColorId }) {
	const state = useCanvasState().getPropertyPanelState();
	const handlers = useController();
	const selected = state.colorId === colorId;

	const handleClick: MouseEventHandler = useCallback(
		(ev) => {
			ev.stopPropagation();
			handlers.handleColorButtonClick(colorId);
		},
		[handlers, colorId],
	);

	return (
		<button
			onClick={handleClick}
			type="button"
			aria-selected={selected}
			css={{
				position: "relative",
				border: "none",
				background: "none",
				width: "32px",
				height: "32px",
				borderRadius: 8,
				transition: "background 0.2s",
				cursor: "pointer",

				"&:hover": {
					transition: "background 0.1s",
					background: "#f2f2f2",
				},

				"&::after": {
					content: '""',
					position: "absolute",
					inset: "8px",
					borderRadius: "50%",
					background: Colors[colorId],
				},

				"&[aria-selected='true']": {
					background: "#f2f2f2",
				},
			}}
		/>
	);
}
