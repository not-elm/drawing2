import {
    type HTMLProps,
    type ReactNode,
    createContext,
    useContext,
    useState,
} from "react";
import { createPortal } from "react-dom";

const context = createContext<{
    container: HTMLElement | null;
    setContainer: (container: HTMLElement | null) => void;
}>({
    container: null,
    setContainer: () => {},
});

export function Portal(props: HTMLProps<HTMLDivElement>) {
    const { container } = useContext(context);
    if (container === null) {
        return;
    }

    return createPortal(<div {...props} />, container);
}

export function PortalMountPoint() {
    const { setContainer } = useContext(context);

    return (
        <div
            ref={(e: HTMLElement | null) => {
                setContainer(e);
            }}
        />
    );
}

export function PortalContextProvider({ children }: { children?: ReactNode }) {
    const [container, setContainer] = useState<HTMLElement | null>(null);

    return (
        <context.Provider
            value={{
                container,
                setContainer,
            }}
        >
            {children}
        </context.Provider>
    );
}
