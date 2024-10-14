import { MathJax } from "better-react-mathjax";
import { memo } from "react";
import {
    type ColorId,
    ColorPaletteBackground,
    ColorPaletteBackgroundMonoColor,
    Colors,
} from "../../../core/model/Colors";
import type { FillStyle } from "../../../core/model/FillStyle";
import { PropertyKey } from "../../../core/model/PropertyKey";
import type { StrokeStyle } from "../../../core/model/StrokeStyle";
import type { TextAlignment } from "../../../core/model/TextAlignment";
import { useStore } from "../../../react/hooks/useStore";
import { useApp } from "../../../react/useApp";
import { STROKE_WIDTH_BASE } from "../PathEntity/PathView";
import type { ShapeEntity } from "./ShapeEntity";

export const ShapeView = memo(function ShapeView({
    entity,
}: { entity: ShapeEntity }) {
    const app = useApp();
    const appState = useStore(app.appStateStore);
    const isLabelEditing =
        appState.mode.type === "edit-text" &&
        appState.mode.entityId === entity.id;

    return (
        <div
            style={{
                transform: `translate(${entity.rect.left}px, ${entity.rect.top}px)`,
            }}
            css={{ position: "absolute" }}
        >
            <ShapeViewInner
                isLabelEditing={isLabelEditing}
                shapeId={entity.id}
                width={entity.rect.width}
                height={entity.rect.height}
                path={entity.path}
                colorId={entity[PropertyKey.COLOR_ID]}
                fillStyle={entity[PropertyKey.FILL_STYLE]}
                textAlignX={entity[PropertyKey.TEXT_ALIGNMENT_X]}
                textAlignY={entity[PropertyKey.TEXT_ALIGNMENT_Y]}
                shapeLabel={entity.content}
                strokeStyle={entity.strokeStyle}
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
    fillStyle,
    textAlignX,
    textAlignY,
    shapeLabel,
    isLabelEditing,
    strokeStyle,
}: {
    shapeId: string;
    width: number;
    height: number;
    path: number[][];
    colorId: ColorId;
    fillStyle: FillStyle;
    textAlignX: TextAlignment;
    textAlignY: TextAlignment;
    shapeLabel: string;
    isLabelEditing: boolean;
    strokeStyle: StrokeStyle;
}) {
    const app = useApp();

    const strokeWidth = {
        solid: STROKE_WIDTH_BASE,
        dashed: STROKE_WIDTH_BASE,
        dotted: STROKE_WIDTH_BASE * 1.4,
    }[strokeStyle];

    return (
        <>
            <svg
                viewBox={`0 0 ${width} ${height}`}
                width={width}
                height={height}
                css={{ overflow: "visible", position: "absolute", inset: 0 }}
            >
                <path
                    d={`M${path
                        .map(([x, y]) => `${x * width},${y * height}`)
                        .join("L")}Z`}
                    css={{
                        stroke: Colors[colorId],
                        strokeLinejoin: "round",
                        strokeLinecap: "round",
                        pointerEvents: "all",
                        ...{
                            none: { fill: "none" },
                            mono: { fill: ColorPaletteBackgroundMonoColor },
                            color: {
                                fill: ColorPaletteBackground[colorId],
                            },
                        }[fillStyle],
                    }}
                    strokeWidth={5}
                    strokeDasharray={
                        {
                            solid: undefined,
                            dashed: [2 * strokeWidth, strokeWidth + 5].join(
                                " ",
                            ),
                            dotted: [0, strokeWidth * (0.5 + 1.2 + 0.5)].join(
                                " ",
                            ),
                        }[strokeStyle]
                    }
                />
            </svg>
            <div
                css={{
                    position: "absolute",
                    left: 0,
                    width,
                    height,
                    display: "flex",
                    flexDirection: "column",
                    fontSize: 24,
                    ...{
                        "start-outside": {},
                        "end-outside": {},
                        start: {
                            alignItems: "flex-start",
                            textAlign: "start" as const,
                        },
                        center: {
                            alignItems: "center",
                            textAlign: "center" as const,
                        },
                        end: {
                            alignItems: "end",
                            textAlign: "end" as const,
                        },
                    }[textAlignX],
                    ...{
                        "start-outside": {
                            justifyContent: "flex-end",
                            top: -height,
                            bottom: height,
                        },
                        start: {
                            justifyContent: "flex-start",
                        },
                        center: {
                            justifyContent: "center",
                        },
                        end: {
                            justifyContent: "end",
                        },
                        "end-outside": {
                            justifyContent: "flex-start",
                            top: height,
                            bottom: -height,
                        },
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
                            app.canvasStateStore.setContent(ev.target.value)
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
