import { type ReactNode, createContext, useContext, useMemo } from "react";
import { Controller } from "../service/Controller";

const context = createContext<Controller>(null as never);

export function ControllerProvider({ children }: { children?: ReactNode }) {
    const controller = useMemo(() => new Controller(), []);

    return <context.Provider value={controller}>{children}</context.Provider>;
}

export function useController(): Controller {
    return useContext(context);
}
