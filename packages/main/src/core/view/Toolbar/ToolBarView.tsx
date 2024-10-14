import styled from "@emotion/styled";
import type { StateOf } from "../../../lib/Store";
import { Card } from "../../../react/Card";
import type { ToolBar } from "./ToolBar";

export function ToolBarView({
    controller,
    state,
}: {
    controller: ToolBar;
    state: StateOf<ToolBar>;
}) {
    return (
        <Card
            css={{
                padding: "4px 4px",
            }}
        >
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
                    gap: 16,
                }}
            >
                {state.buttons.map((button, i) => (
                    <li key={i}>
                        <Button
                            aria-checked={state.mode.type === button.mode.type}
                            css={{
                                pointerEvents: "all",
                            }}
                            onPointerDown={() =>
                                controller.setMode(button.mode)
                            }
                        >
                            {button.label}
                        </Button>
                    </li>
                ))}
            </ul>
        </Card>
    );
}

const Button = styled.button({
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "48px",
    height: "48px",
    padding: "8px",
    background: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background-color 0.2s",
    "&:hover": {
        backgroundColor: "#f0f0f0",
        transition: "background-color none",
    },
    '&[aria-checked="true"]': {
        backgroundColor: "var(--color-ui-selected)",
        color: "#fff",
        transition: "background-color none",
    },
});
