import type { ReactNode } from "react";
import { Portal } from "./Portal";

export function Popup({
    left,
    top,
    children,
    onClose,
}: {
    left: number;
    top: number;
    children?: ReactNode;
    onClose?: () => void;
}) {
    return (
        <Portal>
            <div
                ref={(e) => {
                    if (e === null) return;

                    e.focus();
                }}
                // biome-ignore lint/a11y/noNoninteractiveTabindex: <explanation>
                tabIndex={0}
                css={{
                    pointerEvents: "all",
                    position: "fixed",
                    inset: 0,
                    outline: "none",
                    focusRing: "none",
                }}
                onPointerDown={(ev) => {
                    onClose?.();
                    ev.stopPropagation();
                    ev.preventDefault();
                }}
                onKeyDownCapture={(ev) => {
                    if (ev.key === "Escape") {
                        onClose?.();
                        ev.stopPropagation();
                        ev.preventDefault();
                    }
                }}
            >
                <div
                    css={{
                        display: "inline-block",
                        transform: `translate(${left}px, ${top}px)`,
                    }}
                    onPointerDown={(ev) => {
                        ev.stopPropagation();
                    }}
                >
                    {children}
                </div>
            </div>
        </Portal>
    );
}
