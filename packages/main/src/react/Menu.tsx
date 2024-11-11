import styled from "@emotion/styled";
import {
    type ButtonHTMLAttributes,
    type ForwardedRef,
    type ReactNode,
    forwardRef,
} from "react";
import { Variables } from "./Variables";

const Menu = forwardRef(function Menu(
    {
        children,
    }: {
        children?: ReactNode;
    },
    ref: ForwardedRef<HTMLUListElement>,
) {
    return (
        <ul
            role="menu"
            ref={ref}
            css={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                pointerEvents: "all",
                background: Variables.color.backgroundContrast,
            }}
        >
            {children}
        </ul>
    );
});

function MenuItem({
    children,
    onClick,
    buttonProps = {},
}: {
    children?: ReactNode;
    onClick: () => void;
    buttonProps?: ButtonHTMLAttributes<HTMLButtonElement>;
}) {
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
            <MenuItemButton
                role="menuitem"
                type="button"
                onClick={onClick}
                {...buttonProps}
            >
                {children}
            </MenuItemButton>
        </li>
    );
}

const MenuItemButton = styled.button({
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    flex: "1 1 0",
    gap: 4,
    paddingInline: Variables.size.spacing.md,
    paddingBlock: Variables.size.spacing.xs,
    margin: 0,
    background: "none",
    border: "none",
    cursor: "pointer",

    "&:hover": {
        background: Variables.color.backgroundHover,
    },

    "&[aria-selected=true]": {
        background: Variables.color.backgroundSelected,
    },
});

const defaults = Object.assign(Menu, {
    Item: MenuItem,
});

export { defaults as Menu };
