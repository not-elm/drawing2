import { Point } from "./Point";

export class Transform {
    a = 1;
    b = 0;
    c = 0;
    d = 1;
    e = 0;
    f = 0;

    apply(point: Point): Point {
        return new Point(
            this.a * point.x + this.c * point.y + this.e,
            this.b * point.x + this.d * point.y + this.f,
        );
    }

    translate(dx: number, dy: number): this {
        this.e += dx;
        this.f += dy;
        return this;
    }

    scale(origin: Point, sx: number, sy: number): this {
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

    static translate(dx: number, dy: number): Transform {
        return new Transform().translate(dx, dy);
    }

    static scale(origin: Point, sx: number, sy: number): Transform {
        return new Transform().scale(origin, sx, sy);
    }
}
