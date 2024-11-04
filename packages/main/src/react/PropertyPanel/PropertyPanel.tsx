import type { ReactNode } from "react";

export function PropertyPanel({
    children,
}: {
    children?: ReactNode;
}) {
    return (
        <div
            css={{
                position: "relative",
                width: "240px",
                height: "100%",
                padding: "4px 4px",

                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",

                background: "#fff",
                borderLeft: "1px solid #c0c0c0",

                pointerEvents: "all",
                "> * + *": {
                    borderTop: "1px solid #f0f0f0",
                    marginTop: "8px",
                    paddingTop: "8px",
                },
            }}
            onPointerDown={(ev) => ev.stopPropagation()}
        >
            {children}
        </div>
    );
}
