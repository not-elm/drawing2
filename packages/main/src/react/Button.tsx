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
    background: "none",
    borderRadius: 8,
    cursor: "pointer",
    transition: "background-color 0.2s",
    pointerEvents: "all",

    "&:hover": {
        transition: "background-color none",
        backgroundColor: "#f0f0f0",
    },

    '&[aria-checked="true"]': {
        backgroundColor: "var(--color-ui-selected)",
        color: "#fff",
        transition: "background-color none",
    },
    "&[aria-selected='true']": {
        background: "#f2f2f2",
    },
});
