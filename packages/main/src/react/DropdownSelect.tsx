import type { ReactNode } from "react";
import { Button } from "./Button";
import { Dropdown } from "./Dropdown";
import { InputBase } from "./Input";
import { Select } from "./Select";

function DropdownSelect({
    value,
    onChange,
    children,
}: {
    value: string | null;
    onChange: (value: string) => void;
    children?: ReactNode;
}) {
    return (
        <Select value={value} onChange={onChange}>
            <Dropdown>{children}</Dropdown>
        </Select>
    );
}

function DropdownSelectTrigger({
    children,
}: {
    children?: ReactNode;
}) {
    return (
        <Dropdown.Trigger>
            <Button
                css={{
                    ...InputBase,
                    justifyContent: "flex-start",
                }}
            >
                {children ?? <DefaultDropdownSelectTriggerContent />}
            </Button>
        </Dropdown.Trigger>
    );
}

function DefaultDropdownSelectTriggerContent() {
    return Select.useSelectedValue();
}

function DropdownSelectItemList({
    children,
}: {
    children?: ReactNode;
}) {
    return (
        <Dropdown.Body>
            <Select.ItemList>{children}</Select.ItemList>
        </Dropdown.Body>
    );
}

const defaults = Object.assign(DropdownSelect, {
    Trigger: DropdownSelectTrigger,
    ItemList: DropdownSelectItemList,
});

export { defaults as DropdownSelect };
