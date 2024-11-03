import styled from "@emotion/styled";

export const Button = styled.button({
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    padding: "8px",
    position: "relative",
    minWidth: "32px",
    minHeight: "32px",
    border: "none",
    backgroundColor: "var(--color-ui-background)",
    borderRadius: 8,
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
