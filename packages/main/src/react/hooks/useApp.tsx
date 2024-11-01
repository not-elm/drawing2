import { type ReactNode, createContext, useContext } from "react";
import type { App } from "../../core/App";

const context = createContext<App>(null as never);

export function AppProvider({
    app,
    children,
}: { app: App; children?: ReactNode }) {
    return <context.Provider value={app}>{children}</context.Provider>;
}

export function useApp(): App {
    return useContext(context);
}
