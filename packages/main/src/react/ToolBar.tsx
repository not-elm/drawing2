import styled from "@emotion/styled";
import { Card } from "./Card";
import { useController } from "./ControllerProvider";
import { useStore } from "./hooks/useStore";

export function ToolBar() {
    const controller = useController();
    const appState = useStore(controller.appStateStore);

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
                <li>
                    <Button
                        aria-checked={appState.mode.type === "select"}
                        css={{
                            pointerEvents: "all",
                        }}
                        onPointerDown={() => {
                            controller.setMode({ type: "select" });
                        }}
                    >
                        Select
                    </Button>
                </li>
                <li>
                    <Button
                        aria-checked={appState.mode.type === "shape"}
                        css={{
                            pointerEvents: "all",
                        }}
                        onPointerDown={() => {
                            controller.setMode({ type: "shape" });
                        }}
                    >
                        Shape
                    </Button>
                </li>
                <li>
                    <Button
                        aria-checked={appState.mode.type === "line"}
                        css={{
                            pointerEvents: "all",
                        }}
                        onPointerDown={() => {
                            controller.setMode({ type: "line" });
                        }}
                    >
                        Line
                    </Button>
                </li>
                <li>
                    <Button
                        aria-checked={appState.mode.type === "new-text"}
                        css={{
                            pointerEvents: "all",
                        }}
                        onPointerDown={() => {
                            controller.setMode({ type: "new-text" });
                        }}
                    >
                        Text
                    </Button>
                </li>
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
