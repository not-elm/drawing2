import { Point } from "./Point";
import { Shape } from "./Shape";

export class Line extends Shape {
    constructor(
        public readonly p1: Point,
        public readonly p2: Point,
    ) {
        super();
    }

    cross(other: Line): boolean {
        // l1の接線ベクトル
        const p1 = [this.x2 - this.x1, this.y2 - this.y1];

        // l2の両端との外積
        const vl2p11 =
            (other.x1 - this.x1) * p1[1] - (other.y1 - this.y1) * p1[0];
        const vl2p12 =
            (other.x2 - this.x1) * p1[1] - (other.y2 - this.y1) * p1[0];
        if (vl2p11 * vl2p12 > 0) return false;

        // l2の接線ベクトル
        const p2 = [other.x2 - other.x1, other.y2 - other.y1];

        // l1の両端との外積
        const vl1p21 =
            (this.x1 - other.x1) * p2[1] - (this.y1 - other.y1) * p2[0];
        const vl1p22 =
            (this.x2 - other.x1) * p2[1] - (this.y2 - other.y1) * p2[0];
        if (vl1p21 * vl1p22 > 0) return false;

        return true;
    }

    getEdges(): Line[] {
        return [this];
    }

    /**
     * Check if a given point is on the line segment.
     * @param point
     */
    contain(point: Point): boolean {
        const dx = this.x2 - this.x1;
        const dy = this.y2 - this.y1;
        if (Math.abs(dx) > Math.abs(dy)) {
            const rx = (point.x - this.x1) / dx;
            const y = this.y1 + rx * (this.y2 - this.y1);
            return Math.abs(y - point.y) < 1e-6;
        } else {
            const ry = (point.y - this.y1) / dy;
            const x = this.x1 + ry * (this.x2 - this.x1);
            return Math.abs(x - point.x) < 1e-6;
        }
    }

    static of(x1: number, y1: number, x2: number, y2: number): Line {
        return new Line(new Point(x1, y1), new Point(x2, y2));
    }

    get x1(): number {
        return this.p1.x;
    }

    get y1(): number {
        return this.p1.y;
    }

    get x2(): number {
        return this.p2.x;
    }

    get y2(): number {
        return this.p2.y;
    }

    getDistance(point: Point): {
        distance: number;
        point: Point;
    } {
        const { x, y } = point;
        const { x1, y1, x2, y2 } = this;

        const p = (x - x1) * (x2 - x1) + (y - y1) * (y2 - y1);
        if (p < 0)
            return {
                distance: Math.hypot(x - x1, y - y1),
                point: new Point(x1, y1),
            };

        const q = (x - x2) * (x1 - x2) + (y - y2) * (y1 - y2);
        if (q < 0)
            return {
                distance: Math.hypot(x - x2, y - y2),
                point: new Point(x2, y2),
            };

        // 線分の長さ
        const v = Math.hypot(x2 - x1, y2 - y1);

        // 線分と点の距離(符号付き)
        const d = ((x - x1) * (y2 - y1) - (y - y1) * (x2 - x1)) / v;

        return {
            distance: Math.abs(d),
            point: new Point(x + ((y1 - y2) / v) * d, y + ((x2 - x1) / v) * d),
        };
    }
}
