import type { CSSObject } from "@emotion/styled";
import { MathJax } from "better-react-mathjax";
import { memo } from "react";
import { PropertyKey } from "../../../core/model/PropertyKey";
import type { TextAlignment } from "../../../core/model/TextAlignment";
import { assert } from "../../../lib/assert";
import { useResizeObserver } from "../../../react/hooks/useResizeObserver";
import { useStore } from "../../../react/hooks/useStore";
import { useApp } from "../../../react/useApp";
import type { TextEntity } from "./TextEntity";

export const TextView = memo(function ShapeView({
    entity,
}: { entity: TextEntity }) {
    const appState = useStore(useApp().appStateStore);
    const editing =
        appState.mode.type === "edit-text" &&
        appState.mode.entityId === entity.id;

    const textAlignment = entity[PropertyKey.TEXT_ALIGNMENT_X];
    assert(textAlignment !== undefined, "Text alignment must not be null");

    return (
        <div
            style={{
                transform: `translate(${entity.rect.left}px, ${entity.rect.top}px)`,
            }}
            css={{ position: "absolute" }}
        >
            <TextViewInner
                editing={editing}
                shapeId={entity.id}
                width={entity.rect.width}
                height={entity.rect.height}
                sizingMode={entity.sizingMode}
                textAlignment={textAlignment}
                content={entity.content}
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
    const app = useApp();

    const containerRef = useResizeObserver((entry) => {
        // ResizeObserver is not affected by CSS transform.
        // So we don't need to care about the viewport scaling.
        app.handleViewSizeChange(
            shapeId,
            entry.contentRect.width,
            entry.contentRect.height,
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
        >
            {editing ? (
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
                        textAlign: "inherit",
                        pointerEvents: "all",
                        whiteSpace: "inherit",
                        padding: 0,
                    }}
                    onFocus={(ev) => {
                        ev.target.setSelectionRange(0, ev.target.value.length);
                    }}
                    onChange={(ev) =>
                        app.canvasStateStore.setContent(ev.target.value)
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
