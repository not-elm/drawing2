import { type ReactNode, createContext, useContext } from "react";
import { Card } from "./Card";

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
        <Card>
            <ul
                css={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                }}
            >
                {children}
            </ul>
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
        <li
            css={{
                minHeight: "32px",
                minWidth: "80px",
                display: "flex",
                alignItems: "stretch",
                justifyContent: "stretch",
            }}
        >
            <button
                role="option"
                type="button"
                css={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    flex: "1 1 0",
                    gap: 4,
                    padding: "4px 8px",
                    margin: 0,
                    background: "none",
                    border: "none",
                    cursor: "pointer",

                    "&:hover": {
                        background: "var(--color-ui-background-hover)",
                    },

                    "&[aria-selected=true]": {
                        background: "var(--color-ui-background-selected)",
                    },
                }}
                aria-selected={value === selectedValue}
                onClick={() => {
                    select(value);
                }}
            >
                <span
                    className="material-symbols-outlined"
                    css={{
                        fontSize: "20px",
                        color: "var(--color-ui-primary)",
                        visibility:
                            value === selectedValue ? "visible" : "hidden",
                    }}
                >
                    check
                </span>
                {children}
            </button>
        </li>
    );
}

const defaults = Object.assign(Select, {
    ItemList: SelectItemList,
    Item: SelectItem,
    useSelectedValue,
});

export { defaults as Select };
