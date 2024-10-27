import { Line } from "./Line";
import { Point } from "./Point";
import { Rect } from "./Rect";

export class TransformMatrix {
    a = 1;
    b = 0;
    c = 0;
    d = 1;
    e = 0;
    f = 0;

    apply(point: Point): Point;
    apply(line: Line): Line;
    apply(rect: Rect): Rect;
    apply(geo: Point | Line | Rect): Point | Line | Rect {
        if (geo instanceof Point) {
            return this.applyToPoint(geo);
        } else if (geo instanceof Line) {
            return this.applyToLine(geo);
        } else {
            return this.applyToRect(geo);
        }
    }

    translate(dx: number, dy: number): TransformMatrix {
        this.e += dx;
        this.f += dy;
        return this;
    }

    scale(origin: Point, sx: number, sy: number): TransformMatrix {
        this.translate(-origin.x, -origin.y);
        this.a *= sx;
        this.b *= sy;
        this.c *= sx;
        this.d *= sy;
        this.e *= sx;
        this.f *= sy;
        this.translate(origin.x, origin.y);

        return this;
    }

    private applyToPoint(point: Point): Point {
        return new Point(
            this.a * point.x + this.c * point.y + this.e,
            this.b * point.x + this.d * point.y + this.f,
        );
    }

    private applyToLine(line: Line): Line {
        return new Line({
            p1: this.applyToPoint(line.p1),
            p2: this.applyToPoint(line.p2),
        });
    }

    private applyToRect(rect: Rect): Rect {
        return Rect.fromPoints(
            this.applyToPoint(rect.topLeft),
            this.applyToPoint(rect.bottomRight),
        );
    }
}

export function scale(origin: Point, sx: number, sy: number): TransformMatrix {
    return new TransformMatrix().scale(origin, sx, sy);
}

export function translate(dx: number, dy: number): TransformMatrix {
    return new TransformMatrix().translate(dx, dy);
}

export function identity(): TransformMatrix {
    return new TransformMatrix();
}
