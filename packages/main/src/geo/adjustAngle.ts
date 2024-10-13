import { Point } from "./Point";

/**
 * Adjust the angle of a line segment to the nearest multiple of a given angle unit.
 * The angle is adjusted by rotating the line segment around its starting point.
 * @param origin The starting point of the line segment.
 * @param target The the ending point of the line segment.
 * @param rOffset  The offset of the angle unit in radians.
 * @param rUnit  The angle unit in radians.
 * @returns The adjusted ending point of the line segment.
 */
export function adjustAngle(
    origin: Point,
    target: Point,
    rOffset: number,
    rUnit: number,
): Point {
    const dx = target.x - origin.x;
    const dy = target.y - origin.y;
    const r = Math.atan2(dy, dx);
    const rAdjusted =
        Math.floor((r - rOffset + rUnit / 2) / rUnit) * rUnit + rOffset;
    const ix = Math.cos(rAdjusted);
    const iy = Math.sin(rAdjusted);
    const norm = dx * ix + dy * iy;
    return new Point(origin.x + norm * ix, origin.y + norm * iy);
}
