import { useMemo } from "react";
import { useStore } from "./hooks/useStore";
import { useApp } from "./useApp";

export function Grid() {
    const app = useApp();
    const viewport = useStore(app.viewportStore);

    const canvas = useMemo(() => document.createElement("canvas"), []);

    const tileImageUrl = useMemo(
        () => generateGridTile(canvas, viewport.scale),
        [canvas, viewport.scale],
    );
    return (
        <div
            css={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${tileImageUrl})`,
                backgroundPosition: `${
                    (Math.ceil(viewport.rect.left / TILE_SIZE) * TILE_SIZE -
                        viewport.rect.left) *
                    viewport.scale
                }px ${
                    (Math.ceil(viewport.rect.top / TILE_SIZE) * TILE_SIZE -
                        viewport.rect.top) *
                    viewport.scale
                }px`,
                backgroundRepeat: "repeat",
            }}
        />
    );
}

const TILE_SIZE = 256;

function generateGridTile(canvas: HTMLCanvasElement, scale: number): string {
    const WIDTH = TILE_SIZE * scale;
    const HEIGHT = TILE_SIZE * scale;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    canvas.style.imageRendering = "pixelated";

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        throw new Error("Could not get 2d context");
    }

    const logScale = Math.log2(scale) / Math.log2(4);

    let gridSize = 4;
    for (let i = 0; i < 3; i++) {
        const bestLogScale = 1 - i;
        ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(
            0,
            (-3 / 2) * Math.abs(logScale - bestLogScale) + 1,
        )})`;
        for (let x = 0; x <= TILE_SIZE; x += gridSize) {
            for (let y = 0; y <= TILE_SIZE; y += gridSize) {
                const circle = new Path2D();
                circle.arc(
                    Math.round(x * scale),
                    Math.round(y * scale),
                    1,
                    0,
                    2 * Math.PI,
                );
                ctx.fill(circle);
            }
        }
        gridSize *= 4;
    }

    return canvas.toDataURL("image/bmp");
}
