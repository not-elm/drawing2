import type { ReactNode } from "react";

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
                    color: "#888",
                    fontSize: "0.75em",
                    lineHeight: 1,
                }}
            >
                {label}
            </span>
            <div>{children}</div>
        </label>
    );
}
