import { MathJaxContext } from "better-react-mathjax";
import { useEffect, useRef } from "react";
import type { App } from "../core/App";
import { SelectEntityModeController } from "../core/SelectEntityModeController";
import { createDefaultApp } from "../default/createDefaultApp";
import { NewPathModeController } from "../default/mode/NewPathModeController";
import { NewShapeModeController } from "../default/mode/NewShapeModeController";
import { NewTextModeController } from "../default/mode/NewTextModeController";
import { Canvas } from "./Canvas";
import { ContextMenuLayer } from "./ContextMenuLayer";
import { ColorPropertySection } from "./PropertyPanel/ColorPropertySection";
import { FillModePropertySection } from "./PropertyPanel/FillModePropertySection";
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
            <StatusBar />
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
                        "--color-ui-foreground": "#404040",
                        "--color-ui-primary": "#3680f4",
                        "--color-ui-primary-hover": "#b0c5fb",
                        "--color-ui-background": "#fff",
                        "--color-ui-background-hover": "#f0f0f0",
                        "--color-ui-selected": "var(--color-ui-primary)",
                        "--color-selection": "var(--color-ui-primary)",
                        "--color-selection-hover":
                            "var(--color-ui-primary-hover)",

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
                            <ToolBar.Button
                                mode={SelectEntityModeController.type}
                            >
                                Select
                            </ToolBar.Button>
                            <ToolBar.Button mode={NewShapeModeController.type}>
                                Rect
                            </ToolBar.Button>
                            <ToolBar.Button mode={NewPathModeController.type}>
                                Line
                            </ToolBar.Button>
                            <ToolBar.Button mode={NewTextModeController.type}>
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
                        </PropertyPanel>
                    </div>
                    <ContextMenuLayer />
                </div>
            </MathJaxContext>
        </AppProvider>
    );
}
