import styled from "@emotion/styled";
import type { LiHTMLAttributes, ReactNode } from "react";
import { Button } from "./Button";
import { Variables } from "./Variables";
import { useApp } from "./hooks/useApp";
import { useCell } from "./hooks/useCell";

const ToolBar = styled.ul({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    background: Variables.color.toolBar.background,
    borderRight: "1px solid",
    borderColor: Variables.color.toolBar.border,
    boxShadow: "0 1px 4px rgba(0, 0, 0, 0.2)",
    paddingBlock: Variables.size.spacing.sm,
    paddingInline: Variables.size.spacing.sm,
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
                role="option"
                css={{ width: 48, height: 48 }}
                aria-selected={currentMode === mode}
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
