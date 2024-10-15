import styled from "@emotion/styled";

const Card = styled.div({
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    background: "#fff",
    border: "1px solid #c0c0c0",
    boxShadow: "0 1px 4px rgba(0, 0, 0, 0.2)",
    padding: "4px 4px",
    borderRadius: "12px",
});

const CardSection = styled.div({
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
});

const defaults = Object.assign(Card, {
    Section: CardSection,
});

export { defaults as Card };
