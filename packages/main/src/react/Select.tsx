import { type ReactNode, createContext, useContext } from "react";
import { Card } from "./Card";
import { Menu } from "./Menu";
import { Variables } from "./Variables";

const context = createContext<{
    value: string | null;
    select: (value: string) => void;
}>({
    value: null,
    select: () => {},
});

function useSelectedValue() {
    return useContext(context).value;
}

function Select({
    value,
    onChange,
    children,
}: {
    value: string | null;
    onChange: (value: string) => void;
    children?: ReactNode;
}) {
    return (
        <context.Provider
            value={{
                value,
                select: (value) => {
                    onChange(value);
                },
            }}
        >
            {children}
        </context.Provider>
    );
}

function SelectItemList({
    children,
}: {
    children?: ReactNode;
}) {
    return (
        <Card
            css={{
                display: "inline-block",
            }}
        >
            <Menu>{children}</Menu>
        </Card>
    );
}

function SelectItem({
    value,
    children,
}: {
    value: string;
    children?: ReactNode;
}) {
    const { value: selectedValue, select } = useContext(context);

    return (
        <Menu.Item
            buttonProps={{
                role: "option",
                "aria-selected": value === selectedValue,
            }}
            onClick={() => {
                select(value);
            }}
        >
            <span
                className="material-symbols-outlined"
                css={{
                    color: Variables.color.foregroundSelected,
                    visibility: value === selectedValue ? "visible" : "hidden",
                    marginInlineEnd: Variables.size.spacing.md,
                }}
            >
                check
            </span>
            {children}
        </Menu.Item>
    );
}

const defaults = Object.assign(Select, {
    ItemList: SelectItemList,
    Item: SelectItem,
    useSelectedValue,
});

export { defaults as Select };
