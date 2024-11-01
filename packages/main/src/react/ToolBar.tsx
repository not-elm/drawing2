import type { LiHTMLAttributes, ReactNode } from "react";
import { Button } from "./Button";
import { Card } from "./Card";
import { useApp } from "./hooks/useApp";
import { useCell } from "./hooks/useCell";

function ToolBar({
    children,
}: {
    children?: ReactNode;
}) {
    return (
        <Card>
            <ul
                css={{
                    padding: 0,
                    margin: 0,
                    listStyle: "none",
                    flex: "0 0 auto",
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                }}
            >
                {children}
            </ul>
        </Card>
    );
}

function ToolBarItem(props: LiHTMLAttributes<HTMLLIElement>) {
    return <li {...props} />;
}

function ToolBarButton({
    mode,
    children,
}: {
    mode: string;
    children?: ReactNode;
}) {
    const app = useApp();
    const currentMode = useCell(app.mode);

    return (
        <ToolBarItem>
            <Button
                css={{ width: 48, height: 48 }}
                aria-checked={currentMode === mode}
                onPointerDown={() => app.setMode(mode)}
            >
                {children}
            </Button>
        </ToolBarItem>
    );
}

const defaults = Object.assign(ToolBar, {
    Button: ToolBarButton,
    Item: ToolBarItem,
});

export { defaults as ToolBar };
