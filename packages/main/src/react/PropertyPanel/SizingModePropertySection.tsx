import {
    PROPERTY_KEY_SIZING_MODE,
    type SizingMode,
} from "../../default/property/SizingMode";
import { Button } from "../Button";
import { Card } from "../Card";
import { useStore } from "../hooks/useStore";
import { useApp } from "../useApp";
import { useSelectedPropertyValue } from "./useSelectedPropertyValue";
import { useVisibleFlag } from "./useVisibleFlag";

export function SizingModePropertySection() {
    const app = useApp();
    const { mode } = useStore(app.appStateStore);
    const selectedEntities = app.canvasStateStore
        .getState()
        .getSelectedEntities();
    const selectedValue = useSelectedPropertyValue(PROPERTY_KEY_SIZING_MODE);

    const handleClick = (sizingMode: SizingMode) => {
        app.canvasStateStore.edit((tx) => {
            tx.updateProperty(
                app.canvasStateStore.getState().selectedEntityIds,
                PROPERTY_KEY_SIZING_MODE,
                sizingMode,
            );
        });
        app.defaultPropertyStore.set(PROPERTY_KEY_SIZING_MODE, sizingMode);
    };

    const visible = useVisibleFlag({
        modes: ["new-text"],
        propertyKeys: [PROPERTY_KEY_SIZING_MODE],
    });
    if (!visible) return null;

    return (
        <Card.Section css={{ flexDirection: "column" }}>
            <Button
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    handleClick("content");
                }}
                aria-selected={selectedValue === "content"}
            >
                内容に合わせて自動調整
            </Button>
            <Button
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    handleClick("fixed");
                }}
                aria-selected={selectedValue === "fixed"}
            >
                幅を固定してテキストを折り返し
            </Button>
        </Card.Section>
    );
}
