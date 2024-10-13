import type { Viewport } from "../model/Viewport";
import type { RestoreViewportService } from "./RestoreViewportService";

export class URLQueryRestoreViewportService implements RestoreViewportService {
    save(viewport: Viewport): void {
        const url = new URL(window.location.href);
        const data = btoa(
            `${viewport.rect.left.toFixed(0)},${viewport.rect.top.toFixed(
                0,
            )},${viewport.scale.toFixed(2)}`,
        );
        url.searchParams.set("viewport", data);

        history.replaceState(null, "", url.toString());
    }
    async restore(): Promise<{
        x: number;
        y: number;
        scale: number;
    } | null> {
        const url = new URL(window.location.href);
        const data = url.searchParams.get("viewport");
        if (data === null) return null;

        try {
            const [x, y, scale] = atob(data)
                .split(",")
                .map((v) => Number.parseFloat(v));
            return { x, y, scale };
        } catch {
            return null;
        }
    }
}
