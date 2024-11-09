import { Color } from "../../core/Color";
import {
    PROPERTY_KEY_FILL_COLOR,
    PROPERTY_KEY_STROKE_COLOR,
} from "../../default/property/Colors";
import { Card } from "../Card";
import { useApp } from "../hooks/useApp";
import { ColorPickerButton } from "./ColorPickerButton";
import { useSelectedPropertyValue } from "./useSelectedPropertyValue";

export function ColorPropertySection() {
    const app = useApp();
    const selectedStrokeColor =
        useSelectedPropertyValue<Color>(PROPERTY_KEY_STROKE_COLOR) ??
        Color.Black;
    const selectedFillColor =
        useSelectedPropertyValue<Color>(PROPERTY_KEY_FILL_COLOR) ??
        Color.Transparent;

    return (
        <Card.Section
            css={{
                padding: "8px 16px",
                display: "flex",
                flexDirection: "row",
                gap: 8,

                label: {
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "flex-start",
                    gap: 4,

                    span: {
                        color: "#888",
                        fontSize: "0.875em",
                    },
                },
            }}
        >
            <label>
                <span>線</span>
                <ColorPickerButton
                    value={selectedStrokeColor}
                    onClose={() => {
                        app.addColorHistory(selectedStrokeColor);
                    }}
                    onChange={(value) => {
                        app.history.addCheckpoint();
                        app.updatePropertyForSelectedEntities(
                            PROPERTY_KEY_STROKE_COLOR,
                            value,
                        );
                        app.setSelectedPropertyValue(
                            PROPERTY_KEY_STROKE_COLOR,
                            value,
                        );
                    }}
                />
            </label>
            <label>
                <span>塗り</span>
                <ColorPickerButton
                    value={selectedFillColor}
                    onClose={() => {
                        app.addColorHistory(selectedFillColor);
                    }}
                    onChange={(value) => {
                        app.history.addCheckpoint();
                        app.updatePropertyForSelectedEntities(
                            PROPERTY_KEY_FILL_COLOR,
                            value,
                        );
                        app.setSelectedPropertyValue(
                            PROPERTY_KEY_FILL_COLOR,
                            value,
                        );
                        app.addColorHistory(value);
                    }}
                />
            </label>
        </Card.Section>
    );
}
