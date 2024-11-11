import type { CSSObject } from "@emotion/styled";
import type { InputHTMLAttributes, ReactNode } from "react";
import { Variables } from "./Variables";

export const InputBase: CSSObject = {
    border: "1px solid",
    borderColor: Variables.color.border,
    borderRadius: Variables.size.borderRadius.sm,
    background: Variables.color.background,
    minWidth: "80px",
    minHeight: Variables.size.minimumTargetSize,
    boxSizing: "border-box",
};

export function Input({
    beforeValue,
    afterValue,
    ...props
}: InputHTMLAttributes<HTMLInputElement> & {
    beforeValue?: ReactNode;
    afterValue?: ReactNode;
}) {
    return (
        <label
            css={{
                display: "inline-flex",
                flexDirection: "row",
                alignItems: "center",
                minWidth: "80px",
                paddingInline: Variables.size.spacing.sm,
                ...InputBase,
            }}
        >
            {beforeValue}
            <input
                {...props}
                onKeyDown={(ev) => {
                    ev.stopPropagation();
                    props.onKeyDown?.(ev);
                }}
                inputMode="numeric"
                size={1}
                css={{
                    display: "inline-block",
                    borderColor: Variables.color.border,
                    minWidth: "60px",
                    boxSizing: "border-box",
                    paddingBlock: Variables.size.spacing.xs,
                    paddingInline: Variables.size.spacing.sm,
                    background: "none",
                    outline: "none",
                    padding: 0,
                    border: "none",
                }}
            />
            {afterValue}
        </label>
    );
}
