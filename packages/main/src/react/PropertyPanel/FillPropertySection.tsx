import { Color } from "../../core/Color";
import { PROPERTY_KEY_FILL_COLOR } from "../../default/property/Colors";
import { Card } from "../Card";
import { FormField } from "../FormField"; // 色
import { useApp } from "../hooks/useApp";
import { ColorPickerButton } from "./ColorPickerButton";
import { useSelectedPropertyValue } from "./useSelectedPropertyValue";

export function FillPropertySection() {
    const app = useApp();
    const selectedColor =
        useSelectedPropertyValue<Color>(PROPERTY_KEY_FILL_COLOR) ?? Color.Black;

    return (
        <Card.Section
            css={{
                padding: "8px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
            }}
        >
            <h4
                css={{
                    margin: 0,
                    color: "#888",
                    fontWeight: "normal",
                }}
            >
                Fill
            </h4>
            <div
                css={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 8,
                }}
            >
                <FormField label="色">
                    <ColorPickerButton
                        value={selectedColor}
                        onClose={() => {
                            app.addColorHistory(selectedColor);
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
                        }}
                    />
                </FormField>
            </div>
        </Card.Section>
    );
}
