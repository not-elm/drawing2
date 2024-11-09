import styled, { type CSSObject } from "@emotion/styled";

export const InputBase: CSSObject = {
    border: "1px solid #ccc",
    borderRadius: "4px",
    background: "#fcfcfc",
    minWidth: "80px",
    minHeight: "32px",
    boxSizing: "border-box",
};

export const Input = styled.input({
    padding: "4px 8px",
    background: "none",
    ...InputBase,
});
