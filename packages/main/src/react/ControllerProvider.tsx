import { type ReactNode, createContext, useContext, useMemo } from "react";
import { createController } from "../instance";
import type { AppController } from "../service/AppController";

const context = createContext<AppController>(null as never);

export function ControllerProvider({ children }: { children?: ReactNode }) {
    const controller = useMemo(() => createController(), []);

    return <context.Provider value={controller}>{children}</context.Provider>;
}

export function useController(): AppController {
    return useContext(context);
}
