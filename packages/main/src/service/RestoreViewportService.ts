import { singleton } from "../lib/singleton";
import type { Viewport } from "../model/Viewport";
import { URLQueryRestoreViewportService } from "./URLQueryRestoreViewportService";

export interface RestoreViewportService {
    save(viewport: Viewport): void;
    restore(): Promise<Viewport | null>;
}

export const getRestoreViewportService = singleton<RestoreViewportService>(
    () => {
        return new URLQueryRestoreViewportService();
    },
);
