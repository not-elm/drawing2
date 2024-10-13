import { type ReactNode, createContext, useContext, useMemo } from "react";
import type { AppController } from "../core/AppController";
import { setUp } from "../instance";

const context = createContext<AppController>(null as never);

export function ControllerProvider({ children }: { children?: ReactNode }) {
    const controller = useMemo(() => setUp(), []);

    return <context.Provider value={controller}>{children}</context.Provider>;
}

export function useController(): AppController {
    return useContext(context);
}
