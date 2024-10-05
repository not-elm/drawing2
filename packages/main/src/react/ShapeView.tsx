import { MathJax } from "better-react-mathjax";
import { type MouseEventHandler, memo, useCallback } from "react";
import {
    type ColorId,
    ColorPaletteBackground,
    ColorPaletteBackgroundMonoColor,
    Colors,
} from "../model/Colors";
import type { FillMode } from "../model/FillMode";
import type { ShapeBlock } from "../model/Page";
import type { TextAlignment } from "../model/TextAlignment";
import { useController } from "./ControllerProvider";

export const ShapeView = memo(function ShapeView({
    shape,
    isLabelEditing,
}: { shape: ShapeBlock; isLabelEditing: boolean }) {
    return (
        <div
            style={{ transform: `translate(${shape.x}px, ${shape.y}px)` }}
            css={{ position: "absolute" }}
        >
            <ShapeViewInner
                isLabelEditing={isLabelEditing}
                shapeId={shape.id}
                width={shape.width}
                height={shape.height}
                path={shape.path}
                colorId={shape.colorId}
                fillMode={shape.fillMode}
                textAlignX={shape.textAlignX}
                textAlignY={shape.textAlignY}
                shapeLabel={shape.label}
            />
        </div>
    );
});

const ShapeViewInner = memo(function ShapeViewInner({
    shapeId,
    width,
    height,
    path,
    colorId,
    fillMode,
    textAlignX,
    textAlignY,
    shapeLabel,
    isLabelEditing,
}: {
    shapeId: string;
    width: number;
    height: number;
    path: number[][];
    colorId: ColorId;
    fillMode: FillMode;
    textAlignX: TextAlignment;
    textAlignY: TextAlignment;
    shapeLabel: string;
    isLabelEditing: boolean;
}) {
    const controller = useController();

    const handleDoubleClick: MouseEventHandler = useCallback(
        (ev) => {
            const handled = controller.handleShapeDoubleClick(
                shapeId,
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
        [shapeId, controller],
    );

    return (
        <>
            <svg
                viewBox={`0 0 ${width} ${height}`}
                width={width}
                height={height}
                css={{ overflow: "visible" }}
            >
                <path
                    d={`M${path
                        .map(([x, y]) => `${x * width},${y * height}`)
                        .join("L")}Z`}
                    css={{
                        stroke: Colors[colorId],
                        pointerEvents: "all",
                        ...{
                            none: { fill: "none" },
                            mono: { fill: ColorPaletteBackgroundMonoColor },
                            color: {
                                fill: ColorPaletteBackground[colorId],
                            },
                        }[fillMode],
                    }}
                    strokeWidth={5}
                    onDoubleClick={handleDoubleClick}
                />
            </svg>
            <div
                css={{
                    position: "absolute",
                    width: "100%",
                    fontSize: 24,
                    ...{
                        "start-outside": {
                            right: "100%",
                            textAlign: "start" as const,
                        },
                        start: { left: 0, textAlign: "start" as const },
                        center: {
                            left: 0,
                            textAlign: "center" as const,
                        },
                        end: { right: 0, textAlign: "end" as const },
                        "end-outside": {
                            left: "100%",
                            textAlign: "end" as const,
                        },
                    }[textAlignX],
                    ...{
                        "start-outside": { bottom: "100%" },
                        start: { top: 0 },
                        center: {
                            top: "50%",
                            transform: "translateY(-50%)",
                        },
                        end: { bottom: 0 },
                        "end-outside": { top: "100%" },
                    }[textAlignY],
                }}
            >
                {isLabelEditing ? (
                    <textarea
                        autoFocus={true}
                        autoComplete="off"
                        css={{
                            display: "block",
                            width: "100%",
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
                            pointerEvents: "all",
                            padding: 0,
                        }}
                        onFocus={(ev) => {
                            ev.target.setSelectionRange(
                                0,
                                ev.target.value.length,
                            );
                        }}
                        onChange={(ev) =>
                            controller.setLabelText(shapeId, ev.target.value)
                        }
                        onPointerDown={(ev) => ev.stopPropagation()}
                        value={shapeLabel}
                    />
                ) : (
                    <MathJax>
                        <span
                            css={{
                                whiteSpace: "pre-wrap",
                            }}
                        >
                            {addPostFix(shapeLabel)}
                        </span>
                    </MathJax>
                )}
            </div>
        </>
    );
});

const ZERO_WIDTH_SPACE = "\u200b";

function addPostFix(text: string) {
    if (text.endsWith("\n") || text.endsWith("\r")) {
        return text + ZERO_WIDTH_SPACE;
    }
    return text;
}
