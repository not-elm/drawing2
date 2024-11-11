import type { ReactNode } from "react";
import { Variables } from "./Variables";

export function FormField({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <label
            css={{
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 4,
            }}
        >
            <span
                css={{
                    color: Variables.color.foregroundWeak,
                    fontSize: Variables.size.font.sm,
                    lineHeight: 1,
                }}
            >
                {label}
            </span>
            <div>{children}</div>
        </label>
    );
}
