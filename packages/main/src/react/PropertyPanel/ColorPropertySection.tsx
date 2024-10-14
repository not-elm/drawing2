import { type ColorId, Colors } from "../../core/model/Colors";
import { PropertyKey } from "../../core/model/PropertyKey";
import { Button } from "../Button";
import { Card } from "../Card";
import { useApp } from "../useApp";
import { useSelectedPropertyValue } from "./useSelectedPropertyValue";

export function useSelectedColorId() {
    return useSelectedPropertyValue<ColorId>(PropertyKey.COLOR_ID);
}

export function ColorPropertySection() {
    const app = useApp();
    const selectedColorId = useSelectedColorId();
    const handleClick = (colorId: ColorId) => {
        app.canvasStateStore.edit((tx) => {
            tx.updateProperty(
                app.canvasStateStore.getState().selectedEntityIds,
                PropertyKey.COLOR_ID,
                colorId,
            );
        });
        app.defaultPropertyStore.set(PropertyKey.COLOR_ID, colorId);
    };

    return (
        <Card.Section
            css={{
                display: "grid",
                gap: 4,
                gridTemplateColumns: "repeat(4, 1fr)",
                gridTemplateRows: "repeat(3, 1fr)",
            }}
        >
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((colorId) => (
                <ColorButton
                    key={colorId}
                    selected={selectedColorId === colorId}
                    onClick={handleClick}
                    colorId={colorId}
                />
            ))}
        </Card.Section>
    );
}

function ColorButton({
    selected,
    onClick,
    colorId,
}: {
    selected: boolean;
    onClick: (colorId: ColorId) => void;
    colorId: ColorId;
}) {
    return (
        <Button
            onPointerDown={(ev) => {
                ev.stopPropagation();
                onClick(colorId);
            }}
            aria-selected={selected}
            css={{
                "&::after": {
                    content: '""',
                    position: "absolute",
                    inset: "8px",
                    borderRadius: "50%",
                    background: Colors[colorId],
                },
            }}
        />
    );
}
