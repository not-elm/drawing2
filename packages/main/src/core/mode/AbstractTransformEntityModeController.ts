import type { App } from "../App";
import type { Entity } from "../Entity";
import type {
    CanvasPointerMoveEvent,
    CanvasPointerUpEvent,
} from "../GestureRecognizer";
import {
    type ModeChangeEvent,
    ModeController,
    type SelectedEntityChangeEvent,
} from "../ModeController";
import { Line } from "../shape/Line";
import { Point } from "../shape/Point";
import { Rect } from "../shape/Shape";
import type { TransformMatrix } from "../shape/TransformMatrix";
import { SelectEntityModeController } from "./SelectEntityModeController";

const SnapGuideKey = "move-entity.snapGuide";

const SNAP_DISTANCE_THRESHOLD_IN_CANVAS = 16;
const EPSILON = 1e-6;

export abstract class AbstractTransformEntityModeController extends ModeController {
    protected startPoint = new Point(0, 0);
    protected originalEntities: Entity[] = [];
    protected originalSelectedEntityIds: ReadonlySet<string> =
        new Set<string>();
    protected originalSelectionRect = Rect.of(0, 0, 1, 1);

    constructor(protected readonly app: App) {
        super();
    }

    onBeforeEnterMode(app: App, ev: ModeChangeEvent): void {
        const selectionRect = app.canvas.selectionRect.get();
        if (selectionRect === null) {
            console.warn("No entity selected");
            ev.abort();
            return;
        }

        this.startPoint = app.pointerPosition.get();
        this.originalSelectionRect = selectionRect;
        this.originalSelectedEntityIds = app.canvas.selectedEntityIds.get();
        this.originalEntities = Array.from(app.canvas.selectedEntities.get());
    }

    onPointerMove(app: App, ev: CanvasPointerMoveEvent): void {
        let point = ev.point;
        let snapAxis: Axis | null = null;
        if (ev.ctrlKey) {
            const snapResult = this.snap(ev.point);
            point = snapResult.point;
            snapAxis = snapResult.axis;
        }
        if (ev.shiftKey) {
            point = this.applyConstraint(point, snapAxis);
        }

        if (ev.ctrlKey) {
            this.updateSnapGuide(point);
        } else {
            this.clearSnapGuide();
        }

        const transform = this.getTransform(this.startPoint, point);

        app.canvas.edit((builder) => {
            builder.setEntities(
                this.originalEntities.map((entity) => {
                    return app.entityHandle.transform(entity, transform);
                }),
            );
        });
    }

    onPointerUp(app: App, ev: CanvasPointerUpEvent): void {
        app.setMode(SelectEntityModeController.type);
        app.getModeController().onPointerUp(app, ev);
    }

    onBeforeExitMode(app: App): void {
        this.originalEntities = [];
        this.clearSnapGuide();
    }

    onAfterSelectedEntitiesChange(app: App, ev: SelectedEntityChangeEvent) {
        if (ev.newSelectedEntityIds.size === 0) {
            this.abort();
        }
    }

    abort() {
        this.app.canvas.edit((builder) => {
            builder.setEntities(this.originalEntities);
        });
        this.app.setMode(SelectEntityModeController.type);
    }

    protected abstract getTransform(
        startPoint: Point,
        currentPoint: Point,
    ): TransformMatrix;

    protected abstract applyConstraint(
        point: Point,
        snapAxis: Axis | null,
    ): Point;

    protected abstract getSnapPoints(point: Point): {
        x: Point[];
        y: Point[];
    };

    private snap(point: Point): { point: Point; axis: Axis | null } {
        const { x: snapPointXs, y: snapPointYs } = this.getSnapPoints(point);

        // Signed distance to the closest snap point
        let snapDistanceX = Number.POSITIVE_INFINITY;
        let snapDistanceY = Number.POSITIVE_INFINITY;

        for (const entity of this.app.getEntitiesInViewport()) {
            if (this.originalSelectedEntityIds.has(entity.id)) {
                continue;
            }
            for (const p2 of this.app.entityHandle.getSnapPoints(entity)) {
                for (const p1 of snapPointXs) {
                    if (Math.abs(p2.x - p1.x) < Math.abs(snapDistanceX)) {
                        snapDistanceX = p2.x - p1.x;
                    }
                }
                for (const p1 of snapPointYs) {
                    if (Math.abs(p2.y - p1.y) < Math.abs(snapDistanceY)) {
                        snapDistanceY = p2.y - p1.y;
                    }
                }
            }
        }

        const snapDistanceThreshold =
            SNAP_DISTANCE_THRESHOLD_IN_CANVAS / this.app.viewport.get().scale;
        let snapAxis: Axis | null = null;
        if (Math.abs(snapDistanceX) < snapDistanceThreshold) {
            point = new Point(point.x + snapDistanceX, point.y);
            snapAxis = "x";
        }
        if (Math.abs(snapDistanceY) < snapDistanceThreshold) {
            point = new Point(point.x, point.y + snapDistanceY);
            if (
                snapAxis === null ||
                Math.abs(snapDistanceY) < Math.abs(snapDistanceX)
            ) {
                snapAxis = "y";
            }
        }

        return { point, axis: snapAxis };
    }

    private updateSnapGuide(point: Point): void {
        const lines: Line[] = [];
        const selfSnapPoints = this.getSnapPoints(point);

        const otherSnapPoints = this.app
            .getEntitiesInViewport()
            .filter((entity) => !this.originalSelectedEntityIds.has(entity.id))
            .flatMap((entity) => this.app.entityHandle.getSnapPoints(entity));

        const points: Set<Point> = new Set();
        for (const p1 of selfSnapPoints.x) {
            const pointsY: Point[] = [];
            for (const p2 of otherSnapPoints) {
                if (Math.abs(p1.x - p2.x) < EPSILON) pointsY.push(p2);
            }
            if (pointsY.length > 0) {
                pointsY.push(p1);
                const minY = pointsY.reduce((min, p) =>
                    min.y < p.y ? min : p,
                );
                const maxY = pointsY.reduce((max, p) =>
                    max.y > p.y ? max : p,
                );
                lines.push(new Line(minY, maxY));
                for (const p of pointsY) points.add(p);
            }
        }
        for (const p1 of selfSnapPoints.y) {
            const pointsX: Point[] = [];
            for (const p2 of otherSnapPoints) {
                if (Math.abs(p1.y - p2.y) < EPSILON) pointsX.push(p2);
            }
            if (pointsX.length > 0) {
                pointsX.push(p1);
                const minX = pointsX.reduce((min, p) =>
                    min.x < p.x ? min : p,
                );
                const maxX = pointsX.reduce((max, p) =>
                    max.x > p.x ? max : p,
                );
                lines.push(new Line(minX, maxX));
                for (const p of pointsX) points.add(p);
            }
        }

        this.app.setSnapGuide(SnapGuideKey, {
            points: [...points],
            lines,
        });
    }

    private clearSnapGuide() {
        this.app.deleteSnapGuide(SnapGuideKey);
    }
}

export type Axis = "x" | "y";
