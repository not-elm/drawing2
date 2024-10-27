import { assert } from "../lib/assert";
import type { App } from "./App";
import type { Entity } from "./Entity";
import {
    type SnapEntry,
    type SnapGuide,
    computeSnapEntry2D,
} from "./SnapEntry";
import { Line } from "./geo/Line";
import { Point } from "./geo/Point";
import { Rect } from "./geo/Rect";
import { type TransformMatrix, scale, translate } from "./geo/TransformMatrix";

interface SnapPoints {
    /**
     * Snap points used for snapping in X-axis.
     */
    x: Point[];

    /**
     * Snap points used for snapping in Y-axis.
     */
    y: Point[];
}

const SNAP_DISTANCE_THRESHOLD = 8;

/**
 * Controller for transforms happened by selection (scale, translate, rotate, etc.)
 */
export abstract class SelectionTransformController {
    protected readonly originalEntities: Entity[];

    constructor(
        public readonly app: App,
        protected readonly initialPoint: Point,
    ) {
        this.originalEntities = app.canvasStateStore
            .getState()
            .getSelectedEntities();
    }

    /**
     * Return the snap points for this transform.
     */
    protected abstract getSnapPoints(): SnapPoints;

    /**
     * Apply constraints to the raw input point. Constraints limits the
     * user input appropriately, such as keeping the proportion, alignment, etc.
     *
     * @param point - The raw input point.
     * @param snappedAxis - If snap is active, this value represents which axis
     * is being snapped to. Constraints should keep position in this axis.
     */
    protected abstract applyConstraints(
        point: Point,
        snappedAxis: "x" | "y" | null,
    ): Point;

    /**
     * Compute the transform matrix that represents the transformation by moving
     * selection handle from `oldPoint` to `newPoint`.
     * @param oldPoint - The original position of the handle.
     * @param nwePoint - The new position of the handle.
     */
    protected abstract getTransform(
        oldPoint: Point,
        nwePoint: Point,
    ): TransformMatrix;

    /**
     * Update the selection handle position and return the corresponding transform matrix
     * @param newPoint - The new position of the handle.
     * @param option - The options for the transformation.
     */
    move(
        newPoint: Point,
        option: {
            constraint?: boolean;
            snap?: boolean;
        },
    ) {
        const { constraint = false, snap = false } = option;

        let snapAxis: "x" | "y" | null = null;
        if (snap) {
            const result = this.applySnap(newPoint);
            snapAxis = result.axis;
            newPoint = result.point;
        }

        if (constraint) {
            newPoint = this.applyConstraints(newPoint, snapAxis);
        }

        const transform = this.getTransform(this.initialPoint, newPoint);

        const transformedSnapPoints = this.getSnapPoints();
        transformedSnapPoints.x = transformedSnapPoints.x.map((point) =>
            transform.apply(point),
        );
        transformedSnapPoints.y = transformedSnapPoints.y.map((point) =>
            transform.apply(point),
        );

        if (snap) {
            this.app.snapGuideStore.setSnapGuide(
                "selectionTransform",
                this.computeSnapGuide(transformedSnapPoints),
            );
        }

        this.app.canvasStateStore.edit((draft) => {
            draft.setEntities(this.originalEntities);
            draft.transformEntities(
                [...this.app.canvasStateStore.getState().selectedEntityIds],
                transform,
            );
        });
    }

    complete() {
        this.app.snapGuideStore.deleteSnapGuide("selectionTransform");
        const entityIds = this.originalEntities.map(
            (entity) => entity.props.id,
        );

        for (const entityId of entityIds) {
            const entity = this.app.canvasStateStore
                .getState()
                .page.entities.get(entityId);
            assert(entity !== undefined, `Entity must exist: ${entityId}`);

            entity.onTransformEnd(this.app);
        }
    }

    private applySnap(point: Point): { axis: "x" | "y" | null; point: Point } {
        const transform = this.getTransform(this.initialPoint, point);
        const snapPoints = this.getSnapPoints();

        let bestEntryX: SnapEntry = {
            before: 0,
            after: 0,
            distance: Number.POSITIVE_INFINITY,
            points: [],
            snapped: false,
        };
        let bestEntryY: SnapEntry = {
            before: 0,
            after: 0,
            distance: Number.POSITIVE_INFINITY,
            points: [],
            snapped: false,
        };
        for (const snapPoint of snapPoints.x) {
            const entry = computeSnapEntry2D(
                this.app.canvasStateStore.getState().page,
                this.app.viewportStore.getState(),
                transform.apply(snapPoint),
                this.app.canvasStateStore.getState().selectedEntityIds,
                SNAP_DISTANCE_THRESHOLD,
            );
            if (entry.x.distance < bestEntryX.distance) {
                bestEntryX = entry.x;
            }
        }

        for (const snapPoint of snapPoints.y) {
            const entry = computeSnapEntry2D(
                this.app.canvasStateStore.getState().page,
                this.app.viewportStore.getState(),
                transform.apply(snapPoint),
                this.app.canvasStateStore.getState().selectedEntityIds,
                SNAP_DISTANCE_THRESHOLD,
            );
            if (entry.y.distance < bestEntryY.distance) {
                bestEntryY = entry.y;
            }
        }

        let axis: "x" | "y";
        if (bestEntryX.snapped && bestEntryY.snapped) {
            axis = bestEntryX.distance < bestEntryY.distance ? "x" : "y";
            point = new Point(
                point.x + bestEntryX.after - bestEntryX.before,
                point.y + bestEntryY.after - bestEntryY.before,
            );
        } else if (bestEntryX.snapped) {
            axis = "x";
            point = new Point(
                point.x + bestEntryX.after - bestEntryX.before,
                point.y,
            );
        } else if (bestEntryY.snapped) {
            axis = "y";
            point = new Point(
                point.x,
                point.y + bestEntryY.after - bestEntryY.before,
            );
        } else {
            return { axis: null, point };
        }

        return { axis, point };
    }

    private computeSnapGuide(snapPoints: SnapPoints): SnapGuide {
        const canvasState = this.app.canvasStateStore.getState();
        const { page } = canvasState;
        const viewport = this.app.viewportStore.getState();

        const snapGuide: SnapGuide = {
            points: [],
            lines: [],
        };
        for (const snapPoint of snapPoints.x) {
            const snapEntry2D = computeSnapEntry2D(
                page,
                viewport,
                snapPoint,
                this.app.canvasStateStore.getState().selectedEntityIds,
                1,
            );
            if (!snapEntry2D.x.snapped) {
                continue;
            }

            snapGuide.points.push(snapPoint);
            snapGuide.points.push(...snapEntry2D.x.points);

            const ys = [
                snapPoint.y,
                ...snapEntry2D.x.points.map((point) => point.y),
            ];
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);

            if (minY !== maxY) {
                snapGuide.lines.push(
                    new Line(
                        new Point(snapEntry2D.x.after, minY),
                        new Point(snapEntry2D.x.after, maxY),
                    ),
                );
            }
        }
        for (const snapPoint of snapPoints.y) {
            const snapEntry2D = computeSnapEntry2D(
                page,
                viewport,
                snapPoint,
                this.app.canvasStateStore.getState().selectedEntityIds,
                1,
            );
            if (!snapEntry2D.y.snapped) {
                continue;
            }

            snapGuide.points.push(snapPoint);
            snapGuide.points.push(...snapEntry2D.y.points);

            const xs = [
                snapPoint.x,
                ...snapEntry2D.y.points.map((point) => point.x),
            ];
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);

            if (minX !== maxX) {
                snapGuide.lines.push(
                    new Line(
                        new Point(minX, snapEntry2D.y.after),
                        new Point(maxX, snapEntry2D.y.after),
                    ),
                );
            }
        }

        return snapGuide;
    }
}

export class TranslateSelectionTransformController extends SelectionTransformController {
    protected getSnapPoints(): { x: Point[]; y: Point[] } {
        const rect = Rect.union(
            this.originalEntities.map((entity) => entity.getBoundingRect()),
        );
        if (rect === null) return { x: [], y: [] };

        const points = [
            rect.topLeft,
            rect.topRight,
            rect.bottomLeft,
            rect.bottomRight,
            rect.center,
        ];

        return { x: points, y: points };
    }

    protected applyConstraints(
        point: Point,
        snappedAxis: "x" | "y" | null,
    ): Point {
        switch (snappedAxis) {
            case "x": {
                return new Point(point.x, this.initialPoint.y);
            }
            case "y": {
                return new Point(this.initialPoint.x, point.y);
            }
            case null: {
                const dx = Math.abs(point.x - this.initialPoint.x);
                const dy = Math.abs(point.y - this.initialPoint.y);

                if (dx > dy) {
                    return new Point(point.x, this.initialPoint.y);
                } else {
                    return new Point(this.initialPoint.x, point.y);
                }
            }
        }
    }

    protected getTransform(oldPoint: Point, newPoint: Point): TransformMatrix {
        return translate(newPoint.x - oldPoint.x, newPoint.y - oldPoint.y);
    }
}

export class ScaleSelectionTransformController extends SelectionTransformController {
    // unit direction vector from transform origin to handle
    private readonly ix: number;
    private readonly iy: number;

    constructor(
        app: App,
        initialPoint: Point,
        private readonly transformOrigin: Point,
        private readonly handlePositionInXAxis: "left" | "center" | "right",
        private readonly handlePositionInYAxis: "top" | "center" | "bottom",
    ) {
        super(app, initialPoint);

        const dx = this.initialPoint.x - this.transformOrigin.x;
        const dy = this.initialPoint.y - this.transformOrigin.y;
        const norm = Math.hypot(dx, dy);
        this.ix = dx / norm;
        this.iy = dy / norm;
    }

    protected getSnapPoints(): { x: Point[]; y: Point[] } {
        const rect = Rect.union(
            this.originalEntities.map((entity) => entity.getBoundingRect()),
        );
        if (rect === null) return { x: [], y: [] };

        const xs: Point[] = [];
        if (this.handlePositionInXAxis === "left") {
            xs.push(rect.topLeft);
            xs.push(rect.bottomLeft);
        }
        if (this.handlePositionInXAxis === "right") {
            xs.push(rect.topRight);
            xs.push(rect.bottomRight);
        }

        const ys: Point[] = [];
        if (this.handlePositionInYAxis === "top") {
            ys.push(rect.topLeft);
            ys.push(rect.topRight);
        }
        if (this.handlePositionInYAxis === "bottom") {
            ys.push(rect.bottomLeft);
            ys.push(rect.bottomRight);
        }

        return { x: xs, y: ys };
    }

    protected applyConstraints(
        point: Point,
        snappedAxis: "x" | "y" | null,
    ): Point {
        const dx = point.x - this.transformOrigin.x;
        const dy = point.y - this.transformOrigin.y;

        switch (snappedAxis) {
            case "x": {
                assert(
                    this.ix !== 0,
                    "If ix==0, X-axis should not be snapped.",
                );
                return new Point(
                    point.x,
                    Math.abs(dx / this.ix) * this.iy + this.transformOrigin.y,
                );
            }
            case "y": {
                assert(
                    this.iy !== 0,
                    "If iy==0, Y-axis should not be snapped.",
                );
                return new Point(
                    Math.abs(dy / this.iy) * this.ix + this.transformOrigin.x,
                    point.y,
                );
            }
            case null: {
                const norm = dx * this.ix + dy * this.iy;
                return new Point(
                    norm * this.ix + this.transformOrigin.x,
                    norm * this.iy + this.transformOrigin.y,
                );
            }
        }
    }

    protected getTransform(oldPoint: Point, newPoint: Point): TransformMatrix {
        const scaleX =
            this.handlePositionInXAxis === "center"
                ? 1
                : (newPoint.x - this.transformOrigin.x) /
                  (oldPoint.x - this.transformOrigin.x);
        const scaleY =
            this.handlePositionInYAxis === "center"
                ? 1
                : (newPoint.y - this.transformOrigin.y) /
                  (oldPoint.y - this.transformOrigin.y);

        return scale(this.transformOrigin, scaleX, scaleY);
    }
}
