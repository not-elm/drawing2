import styled from "@emotion/styled";
import type { LineBlock } from "../model/Page";
import { useController } from "./ControllerProvider";
import { useStore } from "./hooks/useStore";

export function SelectionRect() {
    const controller = useController();
    const appState = useStore(controller.appStateStore);
    const viewport = useStore(controller.viewportStore);
    const canvasState = useStore(controller.canvasStateStore);
    const selectionRect = canvasState.getSelectionRect();
    if (selectionRect === null) return null;

    const { x, y, width, height } = selectionRect;
    const blocks = canvasState.getSelectedBlocks();
    const isSingleLineMode = blocks.length === 1 && blocks[0].type === "line";
    const isSingleTextMode = blocks.length === 1 && blocks[0].type === "text";

    return (
        <div
            css={{
                position: "absolute",
                left: (x - viewport.x) * viewport.scale,
                top: (y - viewport.y) * viewport.scale,
                width: width * viewport.scale,
                height: height * viewport.scale,
            }}
        >
            <svg
                viewBox="0 0 1 1"
                width={1}
                height={1}
                css={{
                    position: "absolute",
                    inset: 0,
                    overflow: "visible",
                }}
            >
                {!isSingleLineMode && (
                    <rect
                        css={{
                            stroke: "var(--color-selection)",
                            fill: "none",
                        }}
                        x={0}
                        y={0}
                        width={width * viewport.scale}
                        height={height * viewport.scale}
                        strokeWidth={3}
                    />
                )}
                {blocks.map((obj) => {
                    if (obj.type === "shape") {
                        return (
                            <rect
                                key={obj.id}
                                css={{
                                    stroke: "var(--color-selection)",
                                    fill: "none",
                                }}
                                x={(obj.x - x) * viewport.scale}
                                y={(obj.y - y) * viewport.scale}
                                width={obj.width * viewport.scale}
                                height={obj.height * viewport.scale}
                                strokeWidth={1}
                            />
                        );
                    }
                    if (obj.type === "line") {
                        return (
                            <line
                                key={obj.id}
                                css={{
                                    stroke: "var(--color-selection)",
                                    fill: "none",
                                }}
                                x1={(obj.x1 - x) * viewport.scale}
                                y1={(obj.y1 - y) * viewport.scale}
                                x2={(obj.x2 - x) * viewport.scale}
                                y2={(obj.y2 - y) * viewport.scale}
                                strokeWidth={1}
                            />
                        );
                    }
                })}
            </svg>
            {isSingleLineMode && appState.mode.type === "select" && (
                <>
                    <ResizeHandle
                        css={{
                            left:
                                ((blocks[0] as LineBlock).x1 - x) *
                                viewport.scale,
                            top:
                                ((blocks[0] as LineBlock).y1 - y) *
                                viewport.scale,
                            cursor: "grab",
                        }}
                    >
                        <LineEditHandle />
                    </ResizeHandle>
                    <ResizeHandle
                        css={{
                            left:
                                ((blocks[0] as LineBlock).x2 - x) *
                                viewport.scale,
                            top:
                                ((blocks[0] as LineBlock).y2 - y) *
                                viewport.scale,
                            cursor: "grab",
                        }}
                    >
                        <LineEditHandle />
                    </ResizeHandle>
                </>
            )}
            {isSingleTextMode && appState.mode.type === "select" && null}
            {!isSingleLineMode &&
                !isSingleTextMode &&
                appState.mode.type === "select" && (
                    <>
                        <ResizeHandle
                            css={{
                                top: "0%",
                                left: "0%",
                                width: "100%",
                                cursor: "ns-resize",
                            }}
                        />
                        <ResizeHandle
                            css={{
                                top: "0%",
                                left: "100%",
                                height: "100%",
                                cursor: "ew-resize",
                            }}
                        />
                        <ResizeHandle
                            css={{
                                top: "100%",
                                left: "0%",
                                width: "100%",
                                cursor: "ns-resize",
                            }}
                        />
                        <ResizeHandle
                            css={{
                                top: "0%",
                                left: "0%",
                                height: "100%",
                                cursor: "ew-resize",
                            }}
                        />

                        <ResizeHandle
                            css={{
                                top: "0%",
                                left: "0%",
                                cursor: "nwse-resize",
                            }}
                        >
                            <CornerResizeHandle />
                        </ResizeHandle>
                        <ResizeHandle
                            css={{
                                top: "0%",
                                left: "100%",
                                cursor: "nesw-resize",
                            }}
                        >
                            <CornerResizeHandle />
                        </ResizeHandle>
                        <ResizeHandle
                            css={{
                                top: "100%",
                                left: "100%",
                                cursor: "nwse-resize",
                            }}
                        >
                            <CornerResizeHandle />
                        </ResizeHandle>
                        <ResizeHandle
                            css={{
                                top: "100%",
                                left: "0%",
                                cursor: "nesw-resize",
                            }}
                        >
                            <CornerResizeHandle />
                        </ResizeHandle>
                    </>
                )}
        </div>
    );
}

const ResizeHandle = styled.div({
    position: "absolute",
    transform: "translate(-8px, -8px)",
    minWidth: "16px",
    minHeight: "16px",
});
const CornerResizeHandle = styled.div({
    background: "#fff",
    outline: "2px solid var(--color-selection)",
    boxSizing: "border-box",
    position: "absolute",
    transform: "translate(-50%, -50%)",
    top: "50%",
    left: "50%",
    minWidth: "8px",
    minHeight: "8px",
});
const LineEditHandle = styled.div({
    background: "#fff",
    outline: "2px solid var(--color-selection)",
    borderRadius: "50%",
    boxSizing: "border-box",
    position: "absolute",
    transform: "translate(-50%, -50%)",
    top: "50%",
    left: "50%",
    minWidth: "8px",
    minHeight: "8px",
});
