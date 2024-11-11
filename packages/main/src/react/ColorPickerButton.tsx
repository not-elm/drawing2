import { Color } from "../core/Color";
import { Button } from "./Button";
import { ColorPicker, ColorPreview } from "./ColorPicker";
import { Dropdown } from "./Dropdown";
import { Variables } from "./Variables";

export function ColorPickerButton({
    value,
    onChange,
    onClose,
}: {
    value: Color;
    onChange: (value: Color) => void;
    onClose?: () => void;
}) {
    return (
        <Dropdown onClose={onClose}>
            <Dropdown.Trigger>
                <Button>
                    <ColorPreview value={value} />
                    <span
                        css={{
                            fontFamily: "monospace",
                            color: Variables.color.foregroundWeak,
                            fontSize: Variables.size.font.sm,
                            marginLeft: Variables.size.spacing.sm,
                        }}
                    >
                        {Color.toHex(value)}
                    </span>
                </Button>
            </Dropdown.Trigger>
            <Dropdown.Body>
                <ColorPicker onChange={onChange} value={value} />
            </Dropdown.Body>
        </Dropdown>
    );
}
