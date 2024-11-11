import { Color } from "../../core/Color";
import { PROPERTY_KEY_FILL_COLOR } from "../../default/property/Colors";
import { ColorPickerButton } from "../ColorPickerButton";
import { FormField } from "../FormField";
import { useApp } from "../hooks/useApp";
import { PropertyPane } from "./PropertyPane";
import { useSelectedPropertyValue } from "./useSelectedPropertyValue";

export function FillPropertySection() {
    const app = useApp();
    const selectedColor =
        useSelectedPropertyValue<Color>(PROPERTY_KEY_FILL_COLOR) ?? Color.Black;

    return (
        <PropertyPane.Section>
            <PropertyPane.Header>Fill</PropertyPane.Header>
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
        </PropertyPane.Section>
    );
}
