export class Point {
    constructor(
        public readonly x: number,
        public readonly y: number,
    ) {}

    getDistanceFrom(other: Point): number {
        return Math.hypot(this.x - other.x, this.y - other.y);
    }

    translate(dx: number, dy: number): Point {
        return new Point(this.x + dx, this.y + dy);
    }
}
