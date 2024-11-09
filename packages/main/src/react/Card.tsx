import styled from "@emotion/styled";

const Card = styled.div({
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    background: "#fff",
    boxShadow: "0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)",
    borderRadius: 8,
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
