import { useEffect } from "react";
import { Canvas } from "./Canvas";
import { useController } from "./ControllerProvider";
import { PropertyPanel } from "./PropertyPanel/PropertyPanel";
import { ToolBar } from "./ToolBar";

export function App() {
    const controller = useController();

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            const isHandled = controller.handleKeyDown(event.key, {
                metaKey: event.metaKey,
                ctrlKey: event.ctrlKey,
                shiftKey: event.shiftKey,
            });

            if (isHandled) {
                event.preventDefault();
            }
        }
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [controller]);

    return (
        <div
            css={{
                position: "absolute",
                inset: 0,
                overflow: "clip",
                "--color-ui-primary": "#2568cd",
                "--color-ui-selected": "var(--color-ui-primary)",
                "--color-selection": "var(--color-ui-primary)",

                // Disable mobile browser's default touch gestures (pan, zoom)
                // to prevent conflicts with our event handling such as "pointermove".
                touchAction: "none",
                pointerEvents: "none",
                userSelect: "none",
            }}
        >
            <Canvas />
            <div
                css={{
                    position: "absolute",
                    width: "100%",
                    bottom: 12,
                    left: 12,
                    right: 12,
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                }}
            >
                <ToolBar />
            </div>
            <div
                css={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    bottom: 0,
                    padding: 12,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    overflow: "auto",
                    "&::-webkit-scrollbar": {
                        display: "none",
                    },
                }}
            >
                <PropertyPanel />
            </div>
        </div>
    );
}
