import type { Color } from "../../core/Color";
import { Button } from "../Button";
import { Dropdown } from "../Dropdown";
import { ColorPreview, CustomColorPicker } from "./CustomColorPicker";

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
                </Button>
            </Dropdown.Trigger>
            <Dropdown.Body>
                <CustomColorPicker onChange={onChange} value={value} />
            </Dropdown.Body>
        </Dropdown>
    );
}
