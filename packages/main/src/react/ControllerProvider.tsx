import { type ReactNode, createContext, useContext, useMemo } from "react";
import { Controller } from "../service/Controller";
import { useCanvasStateStore } from "./StoreProvider";

const context = createContext<Controller>(null as never);

export function ControllerProvider({ children }: { children?: ReactNode }) {
	const store = useCanvasStateStore();
	const controller = useMemo(() => new Controller(store), [store]);

	return <context.Provider value={controller}>{children}</context.Provider>;
}

export function useController(): Controller {
	return useContext(context);
}
