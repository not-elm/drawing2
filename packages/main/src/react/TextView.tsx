import type { CSSObject } from "@emotion/styled";
import { MathJax } from "better-react-mathjax";
import { type MouseEventHandler, memo, useCallback } from "react";
import type { TextBlock } from "../model/Page";
import type { TextAlignment } from "../model/TextAlignment";
import { useController } from "./ControllerProvider";
import { useResizeObserver } from "./hooks/useResizeObserver";

export const TextView = memo(function ShapeView({
    text,
    editing,
}: { text: TextBlock; editing: boolean }) {
    return (
        <div
            style={{ transform: `translate(${text.x}px, ${text.y}px)` }}
            css={{ position: "absolute" }}
        >
            <TextViewInner
                editing={editing}
                shapeId={text.id}
                width={text.width}
                height={text.height}
                sizingMode={text.sizingMode}
                textAlignment={text.textAlignment}
                content={text.content}
            />
        </div>
    );
});

const TextViewInner = memo(function ShapeViewInner({
    shapeId,
    width,
    height,
    sizingMode,
    textAlignment,
    editing,
    content,
}: {
    shapeId: string;
    width: number;
    height: number;
    sizingMode: "content" | "fixed";
    textAlignment: TextAlignment;
    editing: boolean;
    content: string;
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

    const containerRef = useResizeObserver((entry) => {
        const canvasWidth = entry.contentRect.width;
        const canvasHeight = entry.contentRect.height;
        controller.handleTextBlockSizeChanged(
            shapeId,
            canvasWidth,
            canvasHeight,
        );
    });

    return (
        <div
            ref={containerRef}
            css={{
                position: "absolute",
                fontSize: 24,
                pointerEvents: "all",
                ...{
                    "start-outside": { textAlign: "start" as const },
                    start: { textAlign: "start" as const },
                    center: { textAlign: "center" as const },
                    end: { textAlign: "end" as const },
                    "end-outside": { textAlign: "end" as const },
                }[textAlignment],
                ...({
                    content: {
                        whiteSpace: "pre",
                        overflow: "visible",
                    },
                    fixed: {
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-all",
                        width,
                    },
                }[sizingMode] as CSSObject),
            }}
            onDoubleClick={handleDoubleClick}
        >
            {editing ? (
                <textarea
                    autoFocus={true}
                    autoComplete="off"
                    css={{
                        display: "block",
                        fieldSizing: "content",
                        border: "none",
                        background: "none",
                        font: "inherit",
                        letterSpacing: "inherit",
                        lineHeight: "inherit",
                        outline: "none",
                        resize: "none",
                        textAlign: "inherit",
                        pointerEvents: "all",
                        whiteSpace: "inherit",
                        padding: 0,
                    }}
                    onFocus={(ev) => {
                        ev.target.setSelectionRange(0, ev.target.value.length);
                    }}
                    onChange={(ev) =>
                        controller.setLabelText(shapeId, ev.target.value)
                    }
                    onPointerDown={(ev) => ev.stopPropagation()}
                    value={content}
                />
            ) : (
                <MathJax>{addPostFix(content)}</MathJax>
            )}
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
