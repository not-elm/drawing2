import styled from "@emotion/styled";
import { Variables } from "../Variables";

const PropertyPane = styled.div({
    position: "relative",
    width: "240px",
    height: "100%",

    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",

    background: Variables.color.sidePane.background,
    borderLeft: "1px solid",
    borderColor: Variables.color.sidePane.border,

    pointerEvents: "all",
});

const Section = styled.div({
    display: "flex",
    flexDirection: "column",
    gap: Variables.size.spacing.md,

    paddingBlock: Variables.size.spacing.md,
    paddingInline: Variables.size.spacing.md,

    "& + &": {
        borderTop: "1px solid",
        borderColor: Variables.color.sidePane.border,
    },
});

const Header = styled.h4({
    margin: 0,
    color: Variables.color.foreground,
    fontWeight: 300,
});

const defaults = Object.assign(PropertyPane, { Section, Header });

export { defaults as PropertyPane };
