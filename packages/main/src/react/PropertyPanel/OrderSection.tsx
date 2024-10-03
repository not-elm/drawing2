import { CardSection } from "../Card";
import { useController } from "../ControllerProvider";

export function OrderSection() {
    const handlers = useController();

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
                    handlers.handleBringToFrontButtonClick();
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
                    handlers.handleBringForwardButtonClick();
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
                    handlers.handleSendBackwardButtonClick();
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
                    handlers.handleSendToBackButtonClick();
                }}
            >
                最背面へ
            </button>
        </CardSection>
    );
}
