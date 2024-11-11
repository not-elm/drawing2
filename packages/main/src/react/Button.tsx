import styled from "@emotion/styled";
import { InputBase } from "./Input";
import { Variables } from "./Variables";

export const Button = styled.button({
    ...InputBase,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    paddingLeft: Variables.size.spacing.sm,
    paddingRight: Variables.size.spacing.sm,
    position: "relative",
    minWidth: Variables.size.minimumTargetSize,
    minHeight: Variables.size.minimumTargetSize,
    cursor: "pointer",
    pointerEvents: "all",
    whiteSpace: "nowrap",

    "&:hover": {
        backgroundColor: Variables.color.backgroundHover,
    },

    "&[aria-selected='true']": {
        backgroundColor: Variables.color.backgroundSelected,
    },
});
