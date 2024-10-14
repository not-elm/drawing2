import type { StateOf } from "../../../lib/Store";
import { Card } from "../../../react/Card";
import type { PropertyPanel } from "./PropertyPanel";

export function PropertyPanelView({
    controller,
    state,
}: {
    controller: PropertyPanel;
    state: StateOf<PropertyPanel>;
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
            {state.sectionControllers.map((controller, i) =>
                controller.render({ key: i }),
            )}
        </Card>
    );
}
