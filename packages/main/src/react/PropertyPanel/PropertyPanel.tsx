import type { ReactNode } from "react";
import { Card } from "../Card";

export function PropertyPanel({
    children,
}: {
    children?: ReactNode;
}) {
    return (
        <Card
            css={{
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
        </Card>
    );
}
