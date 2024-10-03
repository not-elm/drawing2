import styled from "@emotion/styled";

export const Card = styled.div({
    background: "#fff",
    border: "1px solid #c0c0c0",
    boxShadow: "0 1px 4px rgba(0, 0, 0, 0.2)",
    padding: "4px 4px",
    borderRadius: "12px",
});
export const CardSection = styled.div({
    "& + &": {
        borderTop: "1px solid #f0f0f0",
        marginTop: "8px",
        paddingTop: "8px",
    },
});
