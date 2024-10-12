import type { Point } from "../geo/Point";
import { unionRectAll } from "../geo/Rect";
import type { StateProvider } from "../lib/Store";
import { assert } from "../lib/assert";
import type { CanvasStateStore } from "../store/CanvasStateStore";
import type { SnapGuideStore } from "../store/SnapGuideStore";
import type { ViewportStore } from "../store/ViewportStore";
import type { Direction } from "./Direction";
import { type Block, type Page, getBoundingRect } from "./Page";
import {
    type SnapEntry,
    type SnapEntry2D,
    type SnapGuide,
    computeSnapEntry2D,
} from "./SnapEntry";
import { Transaction } from "./Transaction";

export abstract class TransformHandle {
    constructor(
        readonly originalHandlePoint: Point,
        readonly originalBlocks: Block[],
        readonly canvasStateStore: CanvasStateStore,
        readonly viewportProvider: StateProvider<ViewportStore>,
        readonly snapGuideStore: SnapGuideStore,
    ) {
        this.targetBlockIds = originalBlocks.map((block) => block.id);
    }

    protected readonly targetBlockIds: string[];

    apply(
        newHandlePoint: Point,
        option: {
            constraint?: boolean;
            snap?: boolean;
        } = {},
    ) {
        const { constraint = true, snap = true } = option;

        newHandlePoint = { ...newHandlePoint };
        let primaryAxis: "x" | "y" | null = null;

        if (snap) {
            const snapEntry2D = this.computeSnap(newHandlePoint);
            if (snapEntry2D.x.snapped) {
                newHandlePoint.x += snapEntry2D.x.after - snapEntry2D.x.before;
                primaryAxis = "x";
            }
            if (snapEntry2D.y.snapped) {
                newHandlePoint.y += snapEntry2D.y.after - snapEntry2D.y.before;

                if (snapEntry2D.x.snapped) {
                    primaryAxis =
                        snapEntry2D.x.distance < snapEntry2D.y.distance
                            ? "x"
                            : "y";
                } else {
                    primaryAxis = "y";
                }
            }
        }
        if (constraint) {
            newHandlePoint = this.applyConstraints(newHandlePoint, primaryAxis);
        }

        const oldPage = this.canvasStateStore.getState().page;
        const newPage = this.applyTransform(oldPage, newHandlePoint);
        this.canvasStateStore.setPage(newPage);

        if (snap) {
            this.snapGuideStore.setSnapGuide(
                this.computeSnapGuide(newHandlePoint),
            );
        } else {
            this.snapGuideStore.setSnapGuide(null);
        }
    }

    dispose() {
        this.snapGuideStore.setSnapGuide(null);
    }

    protected computeSnapGuide(newHandlePoint: Point): SnapGuide {
        const page = this.canvasStateStore.getState().page;
        const viewport = this.viewportProvider.getState();

        const snapPoints = this.getSnapPoints(newHandlePoint);
        const snapGuide: SnapGuide = {
            points: [],
            lines: [],
        };
        for (const snapPoint of snapPoints) {
            const snapEntry2D = computeSnapEntry2D(
                page,
                viewport,
                snapPoint,
                this.targetBlockIds,
                0,
            );
            if (!snapEntry2D.x.snapped && !snapEntry2D.y.snapped) {
                continue;
            }

            snapGuide.points.push(snapPoint);
            snapGuide.points.push(...snapEntry2D.x.points);
            snapGuide.points.push(...snapEntry2D.y.points);

            const xs = [
                snapPoint.x,
                ...snapEntry2D.y.points.map((point) => point.x),
            ];
            const ys = [
                snapPoint.y,
                ...snapEntry2D.x.points.map((point) => point.y),
            ];

            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);

            if (minX !== maxX) {
                snapGuide.lines.push({
                    x1: minX,
                    y1: snapEntry2D.y.after,
                    x2: maxX,
                    y2: snapEntry2D.y.after,
                });
            }
            if (minY !== maxY) {
                snapGuide.lines.push({
                    x1: snapEntry2D.x.after,
                    y1: minY,
                    x2: snapEntry2D.x.after,
                    y2: maxY,
                });
            }
        }

        return snapGuide;
    }

    protected computeSnap(newHandlePoint: Point): SnapEntry2D {
        const page = this.canvasStateStore.getState().page;
        const viewport = this.viewportProvider.getState();

        let bestSnapEntryX: SnapEntry = {
            before: 0,
            after: 0,
            distance: Number.POSITIVE_INFINITY,
            points: [],
            snapped: false,
        };
        let bestSnapEntryY: SnapEntry = {
            before: 0,
            after: 0,
            distance: Number.POSITIVE_INFINITY,
            points: [],
            snapped: false,
        };

        const snapPoints = this.getSnapPoints(newHandlePoint);
        for (const snapPoint of snapPoints) {
            const snapEntry2D = computeSnapEntry2D(
                page,
                viewport,
                snapPoint,
                this.targetBlockIds,
            );
            if (snapEntry2D.x.distance < bestSnapEntryX.distance) {
                bestSnapEntryX = snapEntry2D.x;
            }
            if (snapEntry2D.y.distance < bestSnapEntryY.distance) {
                bestSnapEntryY = snapEntry2D.y;
            }
        }

        return {
            x: bestSnapEntryX,
            y: bestSnapEntryY,
        };
    }

    protected abstract getSnapPoints(newHandlePoint: Point): Point[];

    /**
     * Apply constraints to the handle point.
     *
     * @param point
     * @param primaryAxis - If snap is active, this value represents which axis
     * is being snapped to. Constraints should keep position in this axis
     * as much as possible.
     * @protected
     */
    protected abstract applyConstraints(
        point: Point,
        primaryAxis: "x" | "y" | null,
    ): Point;

    protected abstract applyTransform(page: Page, newHandlePoint: Point): Page;
}

class ScaleTransformHandle extends TransformHandle {
    // unit direction vector from transform origin to handle
    private readonly ix: number;
    private readonly iy: number;

    constructor(
        originalHandlePoint: Point,
        originalBlocks: Block[],
        canvasStateStore: CanvasStateStore,
        viewportProvider: StateProvider<ViewportStore>,
        snapGuideStore: SnapGuideStore,
        private readonly transformOrigin: Point,
    ) {
        super(
            originalHandlePoint,
            originalBlocks,
            canvasStateStore,
            viewportProvider,
            snapGuideStore,
        );

        const norm = Math.hypot(
            this.originalHandlePoint.x - this.transformOrigin.x,
            this.originalHandlePoint.y - this.transformOrigin.y,
        );
        this.ix = (this.originalHandlePoint.x - this.transformOrigin.x) / norm;
        this.iy = (this.originalHandlePoint.y - this.transformOrigin.y) / norm;
    }

    protected getSnapPoints(newHandlePoint: Point): Point[] {
        return [newHandlePoint];
    }

    protected computeSnap(point: Point) {
        const entry = super.computeSnap(point);

        if (!this.isScalableInXAxis) {
            entry.x.snapped = false;
        }
        if (!this.isScalableInYAxis) {
            entry.y.snapped = false;
        }
        return entry;
    }

    protected applyConstraints(
        point: Point,
        primaryAxis: "x" | "y" | null,
    ): Point {
        const dx = point.x - this.transformOrigin.x;
        const dy = point.y - this.transformOrigin.y;

        switch (primaryAxis) {
            case "x": {
                assert(
                    this.ix !== 0,
                    "If ix==0, X-axis should not be snapped.",
                );
                return {
                    x: point.x,
                    y:
                        Math.abs(dx / this.ix) * this.iy +
                        this.transformOrigin.y,
                };
            }
            case "y": {
                assert(
                    this.iy !== 0,
                    "If iy==0, Y-axis should not be snapped.",
                );
                return {
                    x:
                        Math.abs(dy / this.iy) * this.ix +
                        this.transformOrigin.x,
                    y: point.y,
                };
            }
            case null: {
                const norm = dx * this.ix + dy * this.iy;
                return {
                    x: norm * this.ix + this.transformOrigin.x,
                    y: norm * this.iy + this.transformOrigin.y,
                };
            }
        }
    }

    protected applyTransform(page: Page, newHandlePoint: Point): Page {
        const scaleX = this.isScalableInXAxis
            ? (newHandlePoint.x - this.transformOrigin.x) /
              (this.originalHandlePoint.x - this.transformOrigin.x)
            : 1;
        const scaleY = this.isScalableInYAxis
            ? (newHandlePoint.y - this.transformOrigin.y) /
              (this.originalHandlePoint.y - this.transformOrigin.y)
            : 1;

        return new Transaction(page)
            .replaceBlocks(this.originalBlocks)
            .scaleBlocks(
                this.targetBlockIds,
                this.transformOrigin.x,
                this.transformOrigin.y,
                scaleX,
                scaleY,
            )
            .commit();
    }

    private get isScalableInXAxis() {
        return this.originalHandlePoint.x !== this.transformOrigin.x;
    }

    private get isScalableInYAxis() {
        return this.originalHandlePoint.y !== this.transformOrigin.y;
    }
}

class MoveTransformHandle extends TransformHandle {
    constructor(
        originalHandlePoint: Point,
        originalBlocks: Block[],
        canvasStateStore: CanvasStateStore,
        viewportProvider: StateProvider<ViewportStore>,
        snapGuideStore: SnapGuideStore,
    ) {
        super(
            originalHandlePoint,
            originalBlocks,
            canvasStateStore,
            viewportProvider,
            snapGuideStore,
        );

        const rect = unionRectAll(this.originalBlocks.map(getBoundingRect));
        this.originalSnapPoints = [
            { x: rect.x, y: rect.y },
            { x: rect.x + rect.width, y: rect.y },
            { x: rect.x, y: rect.y + rect.height },
            { x: rect.x + rect.width, y: rect.y + rect.height },
            { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
        ];
    }

    private readonly originalSnapPoints: Point[];

    protected getSnapPoints(newHandlePoint: Point): Point[] {
        const dx = newHandlePoint.x - this.originalHandlePoint.x;
        const dy = newHandlePoint.y - this.originalHandlePoint.y;

        return this.originalSnapPoints.map((point) => ({
            x: point.x + dx,
            y: point.y + dy,
        }));
    }

    protected applyConstraints(
        point: Point,
        primaryAxis: "x" | "y" | null,
    ): Point {
        switch (primaryAxis) {
            case "x": {
                return {
                    x: point.x,
                    y: this.originalHandlePoint.y,
                };
            }
            case "y": {
                return {
                    x: this.originalHandlePoint.x,
                    y: point.y,
                };
            }
            case null: {
                const dx = Math.abs(point.x - this.originalHandlePoint.x);
                const dy = Math.abs(point.y - this.originalHandlePoint.y);

                if (dx > dy) {
                    return {
                        x: point.x,
                        y: this.originalHandlePoint.y,
                    };
                } else {
                    return {
                        x: this.originalHandlePoint.x,
                        y: point.y,
                    };
                }
            }
        }
    }

    protected applyTransform(page: Page, newHandlePoint: Point): Page {
        const dx = newHandlePoint.x - this.originalHandlePoint.x;
        const dy = newHandlePoint.y - this.originalHandlePoint.y;

        return new Transaction(page)
            .replaceBlocks(this.originalBlocks)
            .moveBlocks(this.targetBlockIds, dx, dy)
            .commit();
    }
}

export function createScaleTransformHandle(
    canvasStateStore: CanvasStateStore,
    viewportProvider: StateProvider<ViewportStore>,
    snapGuideStore: SnapGuideStore,
    direction: Direction,
): TransformHandle {
    const targetBlocks = canvasStateStore.getState().getSelectedBlocks();
    const boundingRect = unionRectAll(targetBlocks.map(getBoundingRect));
    const handlePoint = direction.getPoint(boundingRect);
    const transformOrigin = direction.opposite.getPoint(boundingRect);

    return new ScaleTransformHandle(
        handlePoint,
        targetBlocks,
        canvasStateStore,
        viewportProvider,
        snapGuideStore,
        transformOrigin,
    );
}

export function createMoveTransformHandle(
    canvasStateStore: CanvasStateStore,
    viewportProvider: StateProvider<ViewportStore>,
    snapGuideStore: SnapGuideStore,
    handlePoint: Point,
): TransformHandle {
    const targetBlocks = canvasStateStore.getState().getSelectedBlocks();

    return new MoveTransformHandle(
        handlePoint,
        targetBlocks,
        canvasStateStore,
        viewportProvider,
        snapGuideStore,
    );
}
