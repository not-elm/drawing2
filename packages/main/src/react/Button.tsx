import styled from "@emotion/styled";
import { InputBase } from "./Input";

export const Button = styled.button({
    ...InputBase,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    padding: "8px",
    position: "relative",
    minWidth: "32px",
    minHeight: "32px",
    cursor: "pointer",
    pointerEvents: "all",
    whiteSpace: "nowrap",

    "&:hover": {
        backgroundColor: "var(--color-ui-background-hover)",
    },

    "&[aria-checked='true']": {
        backgroundColor: "var(--color-ui-selected)",
        color: "#fff",
        "svg *": {
            stroke: "#fff",
        },
    },
    "&[aria-selected='true']": {
        background: "#f2f2f2",
    },
});
