import styled from "@emotion/styled";
import type { LineObject } from "../model/Page";
import { useCanvasState } from "./CanvasStateStoreProvider";
import { useController } from "./ControllerProvider";
import { useStore } from "./hooks/useStore";

export function SelectionRect() {
    const state = useCanvasState();
    const controller = useController();
    const viewport = useStore(controller.viewportStore);
    const selectionRect = state.getSelectionRect();
    if (selectionRect === null) return null;

    const { x, y, width, height } = selectionRect;
    const objects = state.getSelectedObjects();
    const isSingleLineMode = objects.length === 1 && objects[0].type === "line";

    return (
        <div
            css={{
                position: "absolute",
                left: (x - viewport.x) * viewport.scale,
                top: (y - viewport.y) * viewport.scale,
                width: width * viewport.scale,
                height: height * viewport.scale,
                pointerEvents: "none",
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
                {objects.map((obj) => {
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
            {isSingleLineMode && state.mode === "select" && (
                <>
                    <ResizeHandle
                        css={{
                            left:
                                ((objects[0] as LineObject).x1 - x) *
                                viewport.scale,
                            top:
                                ((objects[0] as LineObject).y1 - y) *
                                viewport.scale,
                            cursor: "grab",
                        }}
                        onMouseDown={(ev) => {
                            ev.stopPropagation();
                            ev.preventDefault();
                            controller.handleSelectionLineHandleMouseDown(
                                ev.clientX,
                                ev.clientY,
                                ev.button,
                                1,
                            );
                        }}
                    >
                        <LineEditHandle />
                    </ResizeHandle>
                    <ResizeHandle
                        css={{
                            left:
                                ((objects[0] as LineObject).x2 - x) *
                                viewport.scale,
                            top:
                                ((objects[0] as LineObject).y2 - y) *
                                viewport.scale,
                            cursor: "grab",
                        }}
                        onMouseDown={(ev) => {
                            ev.stopPropagation();
                            ev.preventDefault();
                            controller.handleSelectionLineHandleMouseDown(
                                ev.clientX,
                                ev.clientY,
                                ev.button,
                                2,
                            );
                        }}
                    >
                        <LineEditHandle />
                    </ResizeHandle>
                </>
            )}
            {!isSingleLineMode && state.mode === "select" && (
                <>
                    <ResizeHandle
                        css={{
                            top: "0%",
                            left: "0%",
                            width: "100%",
                            cursor: "ns-resize",
                        }}
                        onMouseDown={(ev) => {
                            ev.stopPropagation();
                            ev.preventDefault();
                            controller.handleSelectionRectHandleMouseDown(
                                ev.clientX,
                                ev.clientY,
                                ev.button,
                                "top",
                            );
                        }}
                    />
                    <ResizeHandle
                        css={{
                            top: "0%",
                            left: "100%",
                            height: "100%",
                            cursor: "ew-resize",
                        }}
                        onMouseDown={(ev) => {
                            ev.stopPropagation();
                            ev.preventDefault();
                            controller.handleSelectionRectHandleMouseDown(
                                ev.clientX,
                                ev.clientY,
                                ev.button,
                                "right",
                            );
                        }}
                    />
                    <ResizeHandle
                        css={{
                            top: "100%",
                            left: "0%",
                            width: "100%",
                            cursor: "ns-resize",
                        }}
                        onMouseDown={(ev) => {
                            ev.stopPropagation();
                            ev.preventDefault();
                            controller.handleSelectionRectHandleMouseDown(
                                ev.clientX,
                                ev.clientY,
                                ev.button,
                                "bottom",
                            );
                        }}
                    />
                    <ResizeHandle
                        css={{
                            top: "0%",
                            left: "0%",
                            height: "100%",
                            cursor: "ew-resize",
                        }}
                        onMouseDown={(ev) => {
                            ev.stopPropagation();
                            ev.preventDefault();
                            controller.handleSelectionRectHandleMouseDown(
                                ev.clientX,
                                ev.clientY,
                                ev.button,
                                "left",
                            );
                        }}
                    />

                    <ResizeHandle
                        css={{ top: "0%", left: "0%", cursor: "nwse-resize" }}
                        onMouseDown={(ev) => {
                            ev.stopPropagation();
                            ev.preventDefault();
                            controller.handleSelectionRectHandleMouseDown(
                                ev.clientX,
                                ev.clientY,
                                ev.button,
                                "topLeft",
                            );
                        }}
                    >
                        <CornerResizeHandle />
                    </ResizeHandle>
                    <ResizeHandle
                        css={{ top: "0%", left: "100%", cursor: "nesw-resize" }}
                        onMouseDown={(ev) => {
                            ev.stopPropagation();
                            ev.preventDefault();
                            controller.handleSelectionRectHandleMouseDown(
                                ev.clientX,
                                ev.clientY,
                                ev.button,
                                "topRight",
                            );
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
                        onMouseDown={(ev) => {
                            ev.stopPropagation();
                            ev.preventDefault();
                            controller.handleSelectionRectHandleMouseDown(
                                ev.clientX,
                                ev.clientY,
                                ev.button,
                                "bottomRight",
                            );
                        }}
                    >
                        <CornerResizeHandle />
                    </ResizeHandle>
                    <ResizeHandle
                        css={{ top: "100%", left: "0%", cursor: "nesw-resize" }}
                        onMouseDown={(ev) => {
                            ev.stopPropagation();
                            ev.preventDefault();
                            controller.handleSelectionRectHandleMouseDown(
                                ev.clientX,
                                ev.clientY,
                                ev.button,
                                "bottomLeft",
                            );
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
    pointerEvents: "all",
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
    pointerEvents: "all",
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
    pointerEvents: "all",
});
