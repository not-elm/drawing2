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
import { PortalContextProvider, PortalMountPoint } from "./Portal";
import { DebugSection } from "./PropertyPane/DebugSection";
import { FillPropertySection } from "./PropertyPane/FillPropertySection";
import { PropertyPane } from "./PropertyPane/PropertyPane";
import { SizingModePropertySection } from "./PropertyPane/SizingModePropertySection";
import { StrokePropertySection } from "./PropertyPane/StrokePropertySection";
import { TextAlignmentPropertySection } from "./PropertyPane/TextAlignmentPropertySection";
import { ToolBar } from "./ToolBar";
import { Variables } from "./Variables";
import { AppProvider } from "./hooks/useApp";
import NewPathIcon from "./icons/new-path.svg";
import NewShapeIcon from "./icons/new-shape.svg";
import NewTextIcon from "./icons/new-text.svg";
import SelectEntityIcon from "./icons/select-entity.svg";

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
            <PortalContextProvider>
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
                            fontSize: Variables.size.font.md,

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
                                    <SelectEntityIcon />
                                </ToolBar.Button>
                                <ToolBar.Button
                                    mode={NewShapeModeController.type}
                                >
                                    <NewShapeIcon />
                                </ToolBar.Button>
                                <ToolBar.Button
                                    mode={NewPathModeController.type}
                                >
                                    <NewPathIcon />
                                </ToolBar.Button>
                                <ToolBar.Button
                                    mode={NewTextModeController.type}
                                >
                                    <NewTextIcon />
                                </ToolBar.Button>
                            </ToolBar>
                        </div>
                        <div css={{ flex: "1 1 0", position: "relative" }}>
                            <Canvas />
                            <ContextMenuLayer />
                        </div>
                        <div css={{ flex: "0 0 auto" }}>
                            <PropertyPane>
                                <StrokePropertySection />
                                <FillPropertySection />
                                <TextAlignmentPropertySection />
                                <SizingModePropertySection />
                                <DebugSection />
                            </PropertyPane>
                        </div>
                        <PortalMountPoint />
                    </div>
                </MathJaxContext>
            </PortalContextProvider>
        </AppProvider>
    );
}
