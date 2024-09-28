import type { TextAlignment } from "../../model/Rect";
import { useCanvasEventHandler, useCanvasState } from "../StoreProvider";

import { Card, CardSection } from "../Card";

export function PropertyPanel() {
	return (
		<Card>
			<TextAlignmentSection />
		</Card>
	);
}

function TextAlignmentSection() {
	return (
		<CardSection
			css={{ display: "flex", flexDirection: "row", justifyContent: "center" }}
		>
			<div
				css={{
					display: "block",
					position: "relative",
					border: "1px solid #d0d0d0",
					borderRadius: "6px",
					width: "96px",
					height: "96px",
					margin: "32px",
				}}
			>
				<TextAlignButton alignX="start" alignY="start-outside" />
				<TextAlignButton alignX="center" alignY="start-outside" />
				<TextAlignButton alignX="end" alignY="start-outside" />
				<TextAlignButton alignX="start" alignY="start" />
				<TextAlignButton alignX="center" alignY="start" />
				<TextAlignButton alignX="end" alignY="start" />
				<TextAlignButton alignX="start" alignY="center" />
				<TextAlignButton alignX="center" alignY="center" />
				<TextAlignButton alignX="end" alignY="center" />
				<TextAlignButton alignX="start" alignY="end" />
				<TextAlignButton alignX="center" alignY="end" />
				<TextAlignButton alignX="end" alignY="end" />
				<TextAlignButton alignX="start" alignY="end-outside" />
				<TextAlignButton alignX="center" alignY="end-outside" />
				<TextAlignButton alignX="end" alignY="end-outside" />
			</div>
		</CardSection>
	);
}

function TextAlignButton({
	alignX,
	alignY,
}: { alignX: TextAlignment; alignY: TextAlignment }) {
	const state = useCanvasState();
	const handlers = useCanvasEventHandler();
	const [selectedAlignX, selectedAlignY] =
		state.getSelectedShapeTextAlignment() ?? [null, null];
	const selected = selectedAlignX === alignX && selectedAlignY === alignY;

	return (
		<button
			type="button"
			onMouseDown={(ev) => ev.stopPropagation()}
			onClick={(ev) => {
				ev.stopPropagation();
				handlers.handleTextAlignButtonClick(alignX, alignY);
			}}
			aria-selected={selected}
			css={{
				position: "absolute",
				...{
					"start-outside": { right: "100%" },
					start: { left: 0 },
					center: { left: "calc(50% - 16px)" },
					end: { right: 0 },
					"end-outside": { left: "100%" },
				}[alignX],
				...{
					"start-outside": { bottom: "100%" },
					start: { top: 0 },
					center: { top: "calc(50% - 16px)" },
					end: { bottom: 0 },
					"end-outside": { top: "100%" },
				}[alignY],
				width: "32px",
				height: "32px",
				padding: 0,
				margin: 0,
				border: "none",
				pointerEvents: "all",
				cursor: "pointer",
				background: "none",
				display: "flex",
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "center",
				color: "var(--color-ui-selected)",

				"&::after": {
					position: "absolute",
					inset: "12px",
					content: '" "',
					overflow: "hidden",
					borderRadius: "50%",
					background: "rgba(0, 0, 0, 0.1)",
					transition: "background 0.2s",
				},

				"&:hover": {
					"&::after": {
						background: "rgba(0, 0, 0, 0.3)",
					},
				},

				"&[aria-selected='true']": {
					"&::after": {
						display: "none",
					},
				},
			}}
		>
			{selected && (
				<span
					className="material-symbols-outlined"
					css={{
						fontSize: 30,
					}}
				>
					abc
				</span>
			)}
		</button>
	);
}
