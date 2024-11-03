import styled from "@emotion/styled";
import { Card } from "./Card";
import { useApp } from "./hooks/useApp";
import { useCell } from "./hooks/useCell";
import { useResizeObserver } from "./hooks/useResizeObserver";

export function ContextMenuLayer() {
    const app = useApp();
    const contextMenuState = useCell(app.contextMenu.state);

    const resizeObserverRef = useResizeObserver((entry) => {
        app.contextMenu.onMenuResize(
            entry.borderBoxSize[0].inlineSize,
            entry.borderBoxSize[0].blockSize,
        );
    });

    if (!contextMenuState.visible) return null;

    const { x, y } = contextMenuState.positionInCanvas;
    return (
        <div
            css={{
                position: "absolute",
                inset: 0,
                overflow: "visible",
                transform: `translate(${x}px, ${y}px)`,
            }}
        >
            <Card
                ref={resizeObserverRef}
                css={{ display: "inline-flex" }}
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    ev.preventDefault();
                }}
            >
                <ContextMenu>
                    {contextMenuState.items.map((item, i) => (
                        <ContextMenuItem
                            key={i}
                            onClick={() => {
                                item.action();
                                app.contextMenu.hide();
                            }}
                        >
                            {item.title}
                        </ContextMenuItem>
                    ))}
                </ContextMenu>
            </Card>
        </div>
    );
}

const ContextMenu = styled.ul({
    listStyle: "none",
    width: "160px",
    padding: 0,
    margin: 0,
    backgroundColor: "var(--color-ui-background)",
    pointerEvents: "all",
});
const ContextMenuItem = styled.li({
    display: "flex",
    fontSize: "0.75rem",
    color: "var(--color-ui-foreground)",
    backgroundColor: "var(--color-ui-background)",
    minHeight: "32px",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    padding: "0 8px",
    borderRadius: "6px",
    cursor: "pointer",

    "&:hover": {
        backgroundColor: "var(--color-ui-background-hover)",
    },
});
