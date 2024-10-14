import type { Viewport } from "./model/Viewport";

export interface RestoreViewportService {
    save(viewport: Viewport): void;
    restore(): Promise<{
        x: number;
        y: number;
        scale: number;
    } | null>;
}
