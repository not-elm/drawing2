import { Point } from "./Point";

/**
 * Adjust the angle of a line segment to the nearest multiple of a given angle unit.
 * The angle is adjusted by rotating the line segment around its starting point.
 * @param origin The starting point of the line segment.
 * @param target The the ending point of the line segment.
 * @param rOffset  The offset of the angle unit in radians.
 * @param rUnit  The angle unit in radians.
 * @param constraint The constraint to apply to the adjusted line segment.
 * @returns The adjusted ending point of the line segment.
 */
export function adjustAngle(
    origin: Point,
    target: Point,
    rOffset: number,
    rUnit: number,
    constraint: AdjustAngleConstraintMode,
): Point {
    const dx = target.x - origin.x;
    const dy = target.y - origin.y;
    const r = Math.atan2(dy, dx);
    const rAdjusted =
        Math.floor((r - rOffset + rUnit / 2) / rUnit) * rUnit + rOffset;
    const ix = Math.cos(rAdjusted);
    const iy = Math.sin(rAdjusted);

    switch (constraint) {
        case "keep-x": {
            if (ix === 0) {
                return new Point(origin.x, target.y);
            }
            const norm = Math.abs(dx / ix);
            return new Point(target.x, origin.y + norm * iy);
        }
        case "keep-y": {
            if (iy === 0) {
                return new Point(target.x, origin.y);
            }
            const norm = Math.abs(dy / iy);
            return new Point(origin.x + norm * ix, target.y);
        }
        case "none": {
            const norm = dx * ix + dy * iy;
            return new Point(origin.x + norm * ix, origin.y + norm * iy);
        }
    }
}

export type AdjustAngleConstraintMode = "none" | "keep-x" | "keep-y";
