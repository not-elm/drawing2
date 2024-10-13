import { assert } from "../assert";
import { dataclass } from "../dataclass";
import { Line } from "./Line";
import { Point } from "./Point";

export class Rect extends dataclass<{
    p0: Point;
    p1: Point;
}>() {
    static of(x: number, y: number, width: number, height: number): Rect {
        return new Rect({
            p0: new Point(x, y),
            p1: new Point(x + width, y + height),
        });
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
        return new Line({
            p1: this.topLeft,
            p2: this.topRight,
        });
    }

    get rightEdge(): Line {
        return new Line({
            p1: this.topRight,
            p2: this.bottomRight,
        });
    }

    get bottomEdge(): Line {
        return new Line({
            p1: this.bottomRight,
            p2: this.bottomLeft,
        });
    }

    get leftEdge(): Line {
        return new Line({
            p1: this.bottomLeft,
            p2: this.topLeft,
        });
    }

    isOverlappedWith(other: Rect | Line | Point): boolean {
        if (other instanceof Rect) {
            return (
                this.left < other.left + other.width &&
                this.left + this.width > other.left &&
                this.top < other.top + other.height &&
                this.top + this.height > other.top
            );
        }

        if (other instanceof Line) {
            return (
                this.isOverlappedWith(other.p1) ||
                this.isOverlappedWith(other.p2) ||
                this.topEdge.isOverlappedWith(other) ||
                this.rightEdge.isOverlappedWith(other) ||
                this.bottomEdge.isOverlappedWith(other) ||
                this.leftEdge.isOverlappedWith(other)
            );
        }

        return (
            this.left <= other.x &&
            other.x <= this.left + this.width &&
            this.top <= other.y &&
            other.y <= this.top + this.height
        );
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
        if (this.isOverlappedWith(point)) {
            return { distance: 0, point };
        }

        return [this.topEdge, this.rightEdge, this.bottomEdge, this.leftEdge]
            .map((edge) => edge.getDistance(point))
            .sort((a, b) => a.distance - b.distance)[0];
    }

    translate(dx: number, dy: number): Rect {
        return new Rect({
            p0: this.p0.translate(dx, dy),
            p1: this.p1.translate(dx, dy),
        });
    }
}
