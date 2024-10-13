import { singleton } from "../lib/singleton";
import { URLQueryRestoreViewportService } from "./URLQueryRestoreViewportService";
import type { Viewport } from "./model/Viewport";

export interface RestoreViewportService {
    save(viewport: Viewport): void;
    restore(): Promise<{
        x: number;
        y: number;
        scale: number;
    } | null>;
}

export const getRestoreViewportService = singleton<RestoreViewportService>(
    () => {
        return new URLQueryRestoreViewportService();
    },
);
