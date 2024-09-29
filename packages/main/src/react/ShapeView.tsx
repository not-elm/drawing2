import { type MouseEventHandler, memo, useCallback } from "react";
import {
	ColorPaletteBackground,
	ColorPaletteBackgroundMonoColor,
	Colors,
} from "../model/Colors";
import type { Shape } from "../model/Shape";
import { useController } from "./ControllerProvider";

export const ShapeView = memo(function ShapeView({
	shape,
	isLabelEditing,
}: { shape: Shape; isLabelEditing: boolean }) {
	const handlers = useController();

	const handleMouseDown: MouseEventHandler = useCallback(
		(ev) => {
			const handled = handlers.handleShapeMouseDown(
				shape.id,
				ev.clientX,
				ev.clientY,
				ev.button,
				{
					shiftKey: ev.shiftKey,
				},
			);
			if (handled) {
				ev.stopPropagation();
				ev.preventDefault();
			}
		},
		[shape.id, handlers],
	);

	const handleDoubleClick: MouseEventHandler = useCallback(
		(ev) => {
			const handled = handlers.handleShapeDoubleClick(
				shape.id,
				ev.clientX,
				ev.clientY,
				ev.button,
				{
					shiftKey: ev.shiftKey,
				},
			);
			if (handled) {
				ev.stopPropagation();
				ev.preventDefault();
			}
		},
		[shape.id, handlers],
	);

	return (
		<div
			css={{
				position: "absolute",
				left: shape.x,
				top: shape.y,
			}}
			onMouseDown={handleMouseDown}
			onDoubleClick={handleDoubleClick}
		>
			<svg
				viewBox={`0 0 ${shape.width} ${shape.height}`}
				width={shape.width}
				height={shape.height}
				css={{
					overflow: "visible",
					pointerEvents: "none",
				}}
			>
				<rect
					css={{
						pointerEvents: "all",
						stroke: Colors[shape.colorId],
						...{
							none: { fill: "none" },
							mono: { fill: ColorPaletteBackgroundMonoColor },
							color: { fill: ColorPaletteBackground[shape.colorId] },
						}[shape.fillMode],
					}}
					x={0}
					y={0}
					width={shape.width}
					height={shape.height}
					strokeWidth={5}
				/>
			</svg>
			<div
				css={{
					position: "absolute",
					width: "100%",
					fontSize: 24,
					...{
						"start-outside": { right: "100%", textAlign: "start" as const },
						start: { left: 0, textAlign: "start" as const },
						center: {
							left: 0,
							textAlign: "center" as const,
						},
						end: { right: 0, textAlign: "end" as const },
						"end-outside": { left: "100%", textAlign: "end" as const },
					}[shape.textAlignX],
					...{
						"start-outside": { bottom: "100%" },
						start: { top: 0 },
						center: {
							top: "50%",
							transform: "translateY(-50%)",
						},
						end: { bottom: 0 },
						"end-outside": { top: "100%" },
					}[shape.textAlignY],
				}}
			>
				{isLabelEditing ? (
					<textarea
						autoFocus={true}
						autoComplete="off"
						css={{
							fieldSizing: "content",
							border: "none",
							background: "none",
							font: "inherit",
							letterSpacing: "inherit",
							lineHeight: "inherit",
							outline: "none",
							resize: "none",
							whiteSpace: "pre-wrap",
							textAlign: "inherit",
						}}
						onFocus={(ev) => {
							ev.target.setSelectionRange(0, ev.target.value.length);
						}}
						onChange={(ev) =>
							handlers.handleLabelChange(shape.id, ev.target.value)
						}
						onMouseDown={(ev) => {
							ev.stopPropagation();
						}}
						value={shape.label}
					/>
				) : (
					<span
						css={{
							whiteSpace: "pre-wrap",
						}}
					>
						{addPostFix(shape.label)}
					</span>
				)}
			</div>
		</div>
	);
});

const ZERO_WIDTH_SPACE = "\u200b";

function addPostFix(text: string) {
	if (text.endsWith("\n") || text.endsWith("\r")) {
		return text + ZERO_WIDTH_SPACE;
	}
	return text;
}
