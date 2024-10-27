import { Line } from "./Line";
import { Point } from "./Point";
import { Shape } from "./Shape";

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
