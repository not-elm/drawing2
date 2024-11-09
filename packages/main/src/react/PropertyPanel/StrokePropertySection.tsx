import type { CSSObject } from "@emotion/styled";
import { Color } from "../../core/Color";
import { PROPERTY_KEY_STROKE_COLOR } from "../../default/property/Colors";
import {
    PROPERTY_KEY_STROKE_STYLE,
    type StrokeStyle,
} from "../../default/property/StrokeStyle";
import { PROPERTY_KEY_STROKE_WIDTH } from "../../default/property/StrokeWidth";
import { Card } from "../Card";
import { DropdownSelect } from "../DropdownSelect";
import { FormField } from "../FormField"; // 色
import { PixelValueInput } from "../PixelValueInput";
import { Select } from "../Select";
import { useApp } from "../hooks/useApp";
import { ColorPickerButton } from "./ColorPickerButton";
import { useSelectedPropertyValue } from "./useSelectedPropertyValue";

export function StrokePropertySection() {
    const app = useApp();
    const selectedColor =
        useSelectedPropertyValue<Color>(PROPERTY_KEY_STROKE_COLOR) ??
        Color.Black;
    const selectedStyle =
        useSelectedPropertyValue<StrokeStyle>(PROPERTY_KEY_STROKE_STYLE) ??
        "solid";
    const selectedWidth =
        useSelectedPropertyValue<number>(PROPERTY_KEY_STROKE_WIDTH) ?? 1;

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
                Stroke
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
                                PROPERTY_KEY_STROKE_COLOR,
                                value,
                            );
                            app.setSelectedPropertyValue(
                                PROPERTY_KEY_STROKE_COLOR,
                                value,
                            );
                        }}
                    />
                </FormField>
            </div>
            <div
                css={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 8,
                }}
            >
                <FormField label="太さ">
                    <PixelValueInput
                        value={selectedWidth}
                        onChange={(strokeWidth) => {
                            app.history.addCheckpoint();
                            app.updatePropertyForSelectedEntities(
                                PROPERTY_KEY_STROKE_WIDTH,
                                strokeWidth,
                            );
                            app.setSelectedPropertyValue(
                                PROPERTY_KEY_STROKE_WIDTH,
                                strokeWidth,
                            );
                        }}
                    />
                </FormField>

                <FormField label="種類">
                    <DropdownSelect
                        value={selectedStyle}
                        onChange={(style) => {
                            app.history.addCheckpoint();
                            app.updatePropertyForSelectedEntities(
                                PROPERTY_KEY_STROKE_STYLE,
                                style,
                            );
                            app.setSelectedPropertyValue(
                                PROPERTY_KEY_STROKE_STYLE,
                                style,
                            );
                        }}
                    >
                        <DropdownSelect.Trigger>
                            <SelectedStrokeStylePreview />
                        </DropdownSelect.Trigger>
                        <DropdownSelect.ItemList>
                            <Select.Item value="none">
                                <StrokeStylePreview style="none" />
                            </Select.Item>
                            <Select.Item value="solid">
                                <StrokeStylePreview style="solid" />
                            </Select.Item>
                            <Select.Item value="dashed">
                                <StrokeStylePreview style="dashed" />
                            </Select.Item>
                            <Select.Item value="dotted">
                                <StrokeStylePreview style="dotted" />
                            </Select.Item>
                        </DropdownSelect.ItemList>
                    </DropdownSelect>
                </FormField>
            </div>
        </Card.Section>
    );
}

function StrokeStylePreview({ style }: { style: StrokeStyle }) {
    return (
        <span
            css={{
                display: "inline-flex",
                width: 66,
                height: "14px",
                alignItems: "center",
                justifyContent: "flex-start",
                flexDirection: "row",
            }}
        >
            {style === "none" ? (
                <span>なし</span>
            ) : (
                <svg width="100%" height="100%" css={{ overflow: "visible" }}>
                    <path
                        d="M0 7h66"
                        css={{
                            stroke: "currentColor",
                            strokeLinecap: "round",
                            strokeWidth: 4,
                            ...(
                                {
                                    none: { visibility: "hidden" },
                                    solid: {},
                                    dashed: { strokeDasharray: "6 6" },
                                    dotted: { strokeDasharray: "0 8" },
                                } satisfies CSSObject
                            )[style],
                        }}
                    />
                </svg>
            )}
        </span>
    );
}

function SelectedStrokeStylePreview() {
    const style = (Select.useSelectedValue() ?? "solid") as StrokeStyle;

    return <StrokeStylePreview style={style} />;
}
