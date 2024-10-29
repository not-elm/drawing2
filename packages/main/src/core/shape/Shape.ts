import { assert } from "../../lib/assert";
import { Line } from "./Line";
import { Point } from "./Point";

export abstract class Shape {
    /**
     * Returns whether the given point is inside of this shape.
     */
    abstract contain(point: Point): boolean;

    /**
     * Returns edges of the shape.
     */
    abstract getEdges(): Line[];

    /**
     * Returns the bounding rectangle of the shape.
     */
    getBoundingRect(): Rect {
        const edges = this.getEdges();
        const xs = edges.flatMap((edge) => [edge.p1.x, edge.p2.x]);
        const ys = edges.flatMap((edge) => [edge.p1.y, edge.p2.y]);

        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);

        return Rect.of(minX, minY, maxX - minX, maxY - minY);
    }

    /**
     * Returns whether the shape overlaps with the other shape.
     * @param other
     */
    isOverlapWith(other: Shape): boolean {
        const edges1 = this.getEdges();
        const edges2 = other.getEdges();

        if (
            edges2.some(
                (edge2) => this.contain(edge2.p1) || this.contain(edge2.p2),
            )
        ) {
            return true;
        }
        if (
            edges1.some(
                (edge1) => other.contain(edge1.p1) || other.contain(edge1.p2),
            )
        ) {
            return true;
        }

        return edges1.some((edge1) => {
            return edges2.some((edge2) => {
                return edge1.cross(edge2);
            });
        });
    }

    getDistance(point: Point): {
        distance: number;
        point: Point;
    } {
        if (this.contain(point)) {
            return { distance: 0, point };
        }

        const edges = this.getEdges();
        if (edges.length === 0) {
            return {
                distance: Number.POSITIVE_INFINITY,
                point: point,
            };
        }

        const distances = edges.map((edge) => edge.getDistance(point));
        return distances.reduce((prev, current) =>
            prev.distance < current.distance ? prev : current,
        );
    }
}

export class Rect extends Shape {
    constructor(
        public readonly p0: Point,
        public readonly p1: Point,
    ) {
        super();
    }

    getEdges(): Line[] {
        return [this.topEdge, this.rightEdge, this.bottomEdge, this.leftEdge];
    }

    contain(point: Point): boolean {
        return (
            this.left <= point.x &&
            point.x < this.right &&
            this.top <= point.y &&
            point.y < this.bottom
        );
    }

    static of(x: number, y: number, width: number, height: number): Rect {
        return new Rect(new Point(x, y), new Point(x + width, y + height));
    }

    static fromSize(topLeft: Point, width: number, height: number): Rect {
        return Rect.of(topLeft.x, topLeft.y, width, height);
    }

    static fromPoints(p0: Point, p1: Point): Rect {
        const x = Math.min(p0.x, p1.x);
        const y = Math.min(p0.y, p1.y);
        const width = Math.abs(p1.x - p0.x);
        const height = Math.abs(p1.y - p0.y);
        return Rect.of(x, y, width, height);
    }

    get left(): number {
        return this.p0.x;
    }

    get right(): number {
        return this.p1.x;
    }

    get top(): number {
        return this.p0.y;
    }

    get bottom(): number {
        return this.p1.y;
    }

    get width(): number {
        return this.p1.x - this.p0.x;
    }

    get height(): number {
        return this.p1.y - this.p0.y;
    }

    get topLeft(): Point {
        return this.p0;
    }

    get topCenter(): Point {
        return new Point(this.p0.x + (this.p1.x - this.p0.x) / 2, this.p0.y);
    }

    get topRight(): Point {
        return new Point(this.p1.x, this.p0.y);
    }

    get centerLeft(): Point {
        return new Point(this.p0.x, this.p0.y + (this.p1.y - this.p0.y) / 2);
    }

    get center(): Point {
        return new Point(
            this.p0.x + (this.p1.x - this.p0.x) / 2,
            this.p0.y + (this.p1.y - this.p0.y) / 2,
        );
    }

    get centerRight(): Point {
        return new Point(this.p1.x, this.p0.y + (this.p1.y - this.p0.y) / 2);
    }

    get bottomLeft(): Point {
        return new Point(this.p0.x, this.p1.y);
    }

    get bottomCenter(): Point {
        return new Point(this.p0.x + (this.p1.x - this.p0.x) / 2, this.p1.y);
    }

    get bottomRight(): Point {
        return this.p1;
    }

    get topEdge(): Line {
        return new Line(this.topLeft, this.topRight);
    }

    get rightEdge(): Line {
        return new Line(this.topRight, this.bottomRight);
    }

    get bottomEdge(): Line {
        return new Line(this.bottomRight, this.bottomLeft);
    }

    get leftEdge(): Line {
        return new Line(this.bottomLeft, this.topLeft);
    }

    equals(other: Rect): boolean {
        return this.p0.equals(other.p0) && this.p1.equals(other.p1);
    }

    union(other: Rect): Rect {
        const x = Math.min(this.left, other.left);
        const y = Math.min(this.top, other.top);
        const width =
            Math.max(this.left + this.width, other.left + other.width) - x;
        const height =
            Math.max(this.top + this.height, other.top + other.height) - y;

        return Rect.of(x, y, width, height);
    }

    static union(rects: Rect[]): Rect {
        assert(rects.length > 0);
        let rect = rects[0];
        for (const r of rects) {
            rect = rect.union(r);
        }
        return rect;
    }

    getDistance(point: Point): {
        distance: number;
        point: Point;
    } {
        if (this.contain(point)) {
            return { distance: 0, point };
        }

        return [this.topEdge, this.rightEdge, this.bottomEdge, this.leftEdge]
            .map((edge) => edge.getDistance(point))
            .sort((a, b) => a.distance - b.distance)[0];
    }
}
