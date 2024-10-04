import { type MouseEventHandler, memo, useCallback } from "react";
import {
    ColorPaletteBackground,
    ColorPaletteBackgroundMonoColor,
    Colors,
} from "../model/Colors";
import type { ShapeObject } from "../model/Page";
import { useController } from "./ControllerProvider";

export const ShapeView = memo(function ShapeView({
    shape,
    isLabelEditing,
}: { shape: ShapeObject; isLabelEditing: boolean }) {
    const controller = useController();

    const handleDoubleClick: MouseEventHandler = useCallback(
        (ev) => {
            const handled = controller.handleShapeDoubleClick(
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
        [shape.id, controller],
    );

    return (
        <div
            style={{ transform: `translate(${shape.x}px, ${shape.y}px)` }}
            css={{ position: "absolute" }}
        >
            <svg
                viewBox={`0 0 ${shape.width} ${shape.height}`}
                width={shape.width}
                height={shape.height}
                css={{ overflow: "visible" }}
            >
                <path
                    d={`M${shape.path
                        .map(
                            ([x, y]) =>
                                `${x * shape.width},${y * shape.height}`,
                        )
                        .join("L")}Z`}
                    css={{
                        stroke: Colors[shape.colorId],
                        pointerEvents: "all",
                        ...{
                            none: { fill: "none" },
                            mono: { fill: ColorPaletteBackgroundMonoColor },
                            color: {
                                fill: ColorPaletteBackground[shape.colorId],
                            },
                        }[shape.fillMode],
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
                            pointerEvents: "all",
                        }}
                        onFocus={(ev) => {
                            ev.target.setSelectionRange(
                                0,
                                ev.target.value.length,
                            );
                        }}
                        onChange={(ev) =>
                            controller.setLabelText(shape.id, ev.target.value)
                        }
                        onPointerDown={(ev) => ev.stopPropagation()}
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
