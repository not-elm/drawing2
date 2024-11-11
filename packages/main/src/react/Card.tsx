import styled from "@emotion/styled";
import { Variables } from "./Variables";

const Card = styled.div({
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    background: Variables.color.background,
    boxShadow: Variables.shadow.sm,
    border: "1px solid",
    borderColor: Variables.color.borderWeak,
    borderRadius: Variables.size.borderRadius.md,
    overflow: "clip",
});

const CardSection = styled.div({
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 4,
});

const defaults = Object.assign(Card, {
    Section: CardSection,
});

export { defaults as Card };
