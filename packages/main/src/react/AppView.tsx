import { MathJaxContext } from "better-react-mathjax";
import { useEffect, useRef } from "react";
import type { App } from "../core/App";
import { SelectEntityModeController } from "../core/mode/SelectEntityModeController";
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
import { AppProvider } from "./hooks/useApp";

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

                        display: "flex",
                        flexDirection: "row",
                        alignItems: "stretch",
                        justifyContent: "stretch",
                    }}
                >
                    <div css={{ flex: "0 0 auto" }}>
                        <ToolBar
                            css={{
                                position: "relative",
                                height: "100%",
                            }}
                        >
                            <ToolBar.Button
                                mode={SelectEntityModeController.type}
                            >
                                選択
                            </ToolBar.Button>
                            <ToolBar.Button mode={NewShapeModeController.type}>
                                図形
                            </ToolBar.Button>
                            <ToolBar.Button mode={NewPathModeController.type}>
                                パス
                            </ToolBar.Button>
                            <ToolBar.Button mode={NewTextModeController.type}>
                                テキスト
                            </ToolBar.Button>
                        </ToolBar>
                    </div>
                    <div css={{ flex: "1 1 0", position: "relative" }}>
                        <Canvas />
                        <ContextMenuLayer />
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
                </div>
            </MathJaxContext>
        </AppProvider>
    );
}
