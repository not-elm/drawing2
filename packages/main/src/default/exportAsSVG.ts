import type { App } from "../core/App";
import type { Entity, EntityHandleMap } from "../core/Entity";
import { Rect } from "../core/shape/Shape";
import { isNotNullish } from "../lib/isNullish";

export function setUpExportAsSVG(app: App) {
    app.contextMenu.add({
        title: "SVGとしてエクスポート",
        action: () => {
            const page = app.canvas.page.get();
            const selectedEntityIds = app.canvas.selectedEntityIds.get();
            const selectedEntities = page.entityIds
                .filter((id) => selectedEntityIds.has(id))
                .map((id) => page.entities.get(id))
                .filter(isNotNullish);

            const svg = convertToSVG(app.entityHandle, selectedEntities);
            const blob = new Blob([svg], { type: "image/svg+xml" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = "export.svg";
            a.rel = "noopener";
            a.click();

            URL.revokeObjectURL(url);
        },
    });
}

export function convertToSVG(
    handle: EntityHandleMap,
    entities: Entity[],
): string {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("version", "1.1");

    const rect = Rect.union(
        entities.map((entity) => handle.getShape(entity).getBoundingRect()),
    );
    svg.setAttribute("width", `${rect.width}`);
    svg.setAttribute("height", `${rect.height}`);
    svg.setAttribute(
        "viewBox",
        `${rect.left} ${rect.top} ${rect.width} ${rect.height}`,
    );

    for (const entity of entities) {
        const element = handle.getSVGElement(entity);
        if (element !== null) {
            svg.appendChild(element);
        }
    }

    return svg.outerHTML;
}
