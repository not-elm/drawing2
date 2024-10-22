import type { LiHTMLAttributes, ReactNode } from "react";
import { Button } from "./Button";
import { Card } from "./Card";
import { useStore } from "./hooks/useStore";
import { useApp } from "./useApp";

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
    const appState = useStore(app.appStateStore);

    return (
        <ToolBarItem>
            <Button
                css={{ width: 48, height: 48 }}
                aria-checked={appState.mode === mode}
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
