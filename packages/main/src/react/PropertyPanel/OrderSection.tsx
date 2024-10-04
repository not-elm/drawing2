import { CardSection } from "../Card";
import { useController } from "../ControllerProvider";

export function OrderSection() {
    const controller = useController();

    return (
        <CardSection
            css={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "stretch",
                gap: 4,
                pointerEvents: "all",
            }}
            onPointerDown={(ev) => {
                ev.stopPropagation();
            }}
        >
            <button
                type="button"
                css={{
                    pointerEvents: "all",
                }}
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    controller.bringSelectedObjectsToFront();
                }}
            >
                最前面へ
            </button>
            <button
                type="button"
                css={{
                    pointerEvents: "all",
                }}
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    controller.bringSelectedObjectsForward();
                }}
            >
                ひとつ前へ
            </button>
            <button
                type="button"
                css={{
                    pointerEvents: "all",
                }}
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    controller.sendSelectedObjectsBackward();
                }}
            >
                ひとつ後ろへ
            </button>
            <button
                type="button"
                css={{
                    pointerEvents: "all",
                }}
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    controller.sendSelectedObjectsToBack();
                }}
            >
                最背面へ
            </button>
        </CardSection>
    );
}
