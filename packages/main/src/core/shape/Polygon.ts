import { Line } from "./Line";
import { Point } from "./Point";
import { Shape } from "./Shape";

/**
 * The shape that is closed and bounded by line segments.
 * There is no line inside of polygon and the line segments
 * are connected as a single cycle.
 */
export class Polygon extends Shape {
    constructor(public readonly points: Point[]) {
        super();
    }

    contain(point: Point): boolean {
        const ray = new Line(
            point,
            new Point(Number.MAX_SAFE_INTEGER, point.y),
        );

        return (
            this.getEdges().filter((edge) => edge.cross(ray)).length % 2 === 1
        );
    }

    getEdges(): Line[] {
        const lines: Line[] = [];
        for (let i = 0; i < this.points.length; i++) {
            const p1 = this.points[i];
            const p2 =
                i + 1 === this.points.length
                    ? this.points[0]
                    : this.points[i + 1];

            lines.push(new Line(p1, p2));
        }

        return lines;
    }
}
