import { MathJaxContext } from "better-react-mathjax";
import { useEffect, useRef } from "react";
import type { App } from "../core/App";
import { createDefaultApp } from "../default/createDefaultApp";
import { Canvas } from "./Canvas";
import { ColorPropertySection } from "./PropertyPanel/ColorPropertySection";
import { FillModePropertySection } from "./PropertyPanel/FillModePropertySection";
import { OrderSection } from "./PropertyPanel/OrderSection";
import { PropertyPanel } from "./PropertyPanel/PropertyPanel";
import { SizingModePropertySection } from "./PropertyPanel/SizingModePropertySection";
import { StrokeStylePropertySection } from "./PropertyPanel/StrokeStylePropertySection";
import { StrokeWidthPropertySection } from "./PropertyPanel/StrokeWidthPropertySection";
import { TextAlignmentPropertySection } from "./PropertyPanel/TextAlignmentPropertySection";
import { StatusBar } from "./StatusBar";
import { ToolBar } from "./ToolBar";
import { AppProvider } from "./useApp";

export function AppView({ app: controlledApp }: { app?: App }) {
    const appRef = useRef<App>(null as never);
    if (appRef.current === null) {
        appRef.current = createDefaultApp();
    }
    const app = controlledApp ?? appRef.current;

    useEffect(() => {
        function handleKeyDown(ev: KeyboardEvent) {
            app.handleKeyDown(ev);
        }
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [app]);

    return (
        <AppProvider app={app}>
            <MathJaxContext
                version={2}
                config={{
                    // https://docs.mathjax.org/en/stable/start.html#configuring-your-copy-of-mathjax
                    tex2jax: {
                        inlineMath: [
                            ["$", "$"],
                            ["\\(", "\\)"],
                        ],
                    },
                }}
            >
                <div
                    css={{
                        position: "absolute",
                        inset: 0,
                        overflow: "clip",
                        "--color-ui-primary": "#3680f4",
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
                        <ToolBar>
                            <ToolBar.Button mode="select-entity">
                                Select
                            </ToolBar.Button>
                            <ToolBar.Button mode="new-shape">
                                Rect
                            </ToolBar.Button>
                            <ToolBar.Button mode="new-path">
                                Line
                            </ToolBar.Button>
                            <ToolBar.Button mode="new-text">
                                Text
                            </ToolBar.Button>
                        </ToolBar>
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
                        <PropertyPanel>
                            <ColorPropertySection />
                            <TextAlignmentPropertySection />
                            <FillModePropertySection />
                            <StrokeStylePropertySection />
                            <StrokeWidthPropertySection />
                            <SizingModePropertySection />
                            <OrderSection />
                        </PropertyPanel>
                    </div>
                </div>
            </MathJaxContext>
            <StatusBar />
        </AppProvider>
    );
}
