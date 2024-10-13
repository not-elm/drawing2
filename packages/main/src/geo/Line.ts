import { dataclass } from "../lib/dataclass";
import { Point } from "./Point";

export class Line extends dataclass<{
    p1: Point;
    p2: Point;
}>() {
    static of(x1: number, y1: number, x2: number, y2: number): Line {
        return new Line({
            p1: new Point(x1, y1),
            p2: new Point(x2, y2),
        });
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

    isOverlappedWith(other: Line): boolean {
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

    getDistanceFrom(point: Point): {
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
