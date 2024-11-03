import styled from "@emotion/styled";
import type { LiHTMLAttributes, ReactNode } from "react";
import { Button } from "./Button";
import { useApp } from "./hooks/useApp";
import { useCell } from "./hooks/useCell";

const ToolBar = styled.ul({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    background: "#fff",
    borderRight: "1px solid #c0c0c0",
    boxShadow: "0 1px 4px rgba(0, 0, 0, 0.2)",
    padding: "4px 8px",
    margin: 0,
    listStyle: "none",
    flex: "0 0 auto",
    gap: 8,
});

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
