import type { ButtonHTMLAttributes } from "react";

export function PropertyPanelButton({
    ...buttonProps
}: {} & ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...buttonProps}
            css={{
                position: "relative",
                border: "none",
                background: "none",
                minWidth: "32px",
                minHeight: "32px",
                borderRadius: 8,
                transition: "background 0.2s",
                cursor: "pointer",
                pointerEvents: "all",

                "&:hover": {
                    transition: "background 0.1s",
                    background: "#f2f2f2",
                },

                "&[aria-selected='true']": {
                    background: "#f2f2f2",
                },
            }}
        />
    );
}
