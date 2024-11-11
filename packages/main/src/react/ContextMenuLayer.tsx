import { Card } from "./Card";
import { Menu } from "./Menu";
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
                css={{
                    display: "inline-block",
                }}
            >
                <Menu>
                    {contextMenuState.items.map((item, i) => (
                        <Menu.Item
                            key={i}
                            onClick={() => {
                                item.action();
                                app.contextMenu.hide();
                            }}
                        >
                            {item.title}
                        </Menu.Item>
                    ))}
                </Menu>
            </Card>
        </div>
    );
}
