import {
    type ReactNode,
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import { Portal } from "./Portal";
import { useResizeObserver } from "./hooks/useResizeObserver";

const context = createContext<{
    triggerLeft: number;
    triggerBottom: number;
    isOpen: boolean;
    toggleDropdown: () => void;
    setTriggerRect: (rect: {
        top: number;
        left: number;
        bottom: number;
        right: number;
    }) => void;
}>(null as never);

function Dropdown({
    children,
    onClose,
}: { children?: ReactNode; onClose?: () => void }) {
    const [state, setState] = useState({
        triggerLeft: 0,
        triggerBottom: 0,
    });
    const setTriggerRect = (rect: {
        left: number;
        bottom: number;
    }) => {
        setState({
            ...state,
            triggerLeft: rect.left,
            triggerBottom: rect.bottom,
        });
    };

    const [isOpen, setOpen] = useState(false);
    const toggleDropdown = () => {
        if (isOpen) {
            onClose?.();
        }
        setOpen((value) => !value);
    };

    return (
        <context.Provider
            value={{
                ...state,
                isOpen,
                toggleDropdown,
                setTriggerRect,
            }}
        >
            {children}
        </context.Provider>
    );
}

export function DropdownTrigger({ children }: { children?: ReactNode }) {
    const { toggleDropdown, setTriggerRect } = useContext(context);
    const resizeObserverRef = useResizeObserver((rect) => {
        const { top, left, bottom, right } =
            rect.target.getBoundingClientRect();

        setTriggerRect({ top, left, bottom, right });
    });

    const wrapperRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        function handleWindowResize() {
            const wrapper = wrapperRef.current;
            if (wrapper === null) return;

            const { top, left, bottom, right } =
                wrapper.getBoundingClientRect();

            setTriggerRect({ top, left, bottom, right });
        }

        window.addEventListener("resize", handleWindowResize);
        return () => {
            window.removeEventListener("resize", handleWindowResize);
        };
    }, [setTriggerRect]);

    return (
        <div
            ref={(e) => {
                wrapperRef.current = e;
                resizeObserverRef(e);
            }}
            onClickCapture={() => toggleDropdown()}
        >
            {children}
        </div>
    );
}

export function DropdownBody(props: { children?: ReactNode }) {
    const { triggerLeft, triggerBottom, toggleDropdown, isOpen } =
        useContext(context);

    const [{ windowWidth, windowHeight }, setWindowSize] = useState({
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
    });
    const [{ bodyWidth, bodyHeight }, setBodyRect] = useState({
        bodyWidth: 0,
        bodyHeight: 0,
    });

    const resizeObserverRef = useResizeObserver((rect) => {
        setBodyRect({
            bodyWidth: rect.contentRect.width,
            bodyHeight: rect.contentRect.height,
        });
    });

    useEffect(() => {
        function handleWindowResize() {
            setWindowSize({
                windowWidth: window.innerWidth,
                windowHeight: window.innerHeight,
            });
        }

        window.addEventListener("resize", handleWindowResize);
        return () => {
            window.removeEventListener("resize", handleWindowResize);
        };
    }, []);

    if (!isOpen) return null;

    const MARGIN = 24;
    const SPACE_FROM_TRIGGER = 8;

    const translateX =
        triggerLeft < MARGIN
            ? MARGIN
            : triggerLeft + bodyWidth > windowWidth - MARGIN
              ? Math.max(MARGIN, windowWidth - MARGIN - bodyWidth)
              : triggerLeft;

    const translateY =
        triggerBottom + SPACE_FROM_TRIGGER + bodyHeight > windowHeight - MARGIN
            ? Math.max(MARGIN, windowHeight - MARGIN - bodyHeight)
            : triggerBottom + SPACE_FROM_TRIGGER;

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
                }}
                onPointerDown={(ev) => {
                    toggleDropdown();
                    ev.stopPropagation();
                    ev.preventDefault();
                }}
                onKeyDownCapture={(ev) => {
                    if (ev.key === "Escape") {
                        toggleDropdown();
                        ev.stopPropagation();
                        ev.preventDefault();
                    }
                }}
            >
                <div
                    ref={resizeObserverRef}
                    css={{
                        display: "inline-block",
                        transform: `translate(${translateX}px, ${translateY}px)`,
                    }}
                    onPointerDown={(ev) => {
                        ev.stopPropagation();
                    }}
                >
                    {props.children}
                </div>
            </div>
        </Portal>
    );
}

const defaults = Object.assign(Dropdown, {
    Trigger: DropdownTrigger,
    Body: DropdownBody,
});

export { defaults as Dropdown };
