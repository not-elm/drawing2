/**
 * Adjust the angle of a line segment to the nearest multiple of a given angle unit.
 * The angle is adjusted by rotating the line segment around its starting point.
 * @param x0  The x-coordinate of the starting point of the line segment.
 * @param y0  The y-coordinate of the starting point of the line segment.
 * @param x1  The x-coordinate of the ending point of the line segment.
 * @param y1 The y-coordinate of the ending point of the line segment.
 * @param rOffset  The offset of the angle unit in radians.
 * @param rUnit  The angle unit in radians.
 * @returns The adjusted ending point of the line segment.
 */
export function adjustAngle(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    rOffset: number,
    rUnit: number,
): [number, number] {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const r = Math.atan2(dy, dx);
    const rAdjusted =
        Math.floor((r - rOffset + rUnit / 2) / rUnit) * rUnit + rOffset;
    const ix = Math.cos(rAdjusted);
    const iy = Math.sin(rAdjusted);
    const norm = dx * ix + dy * iy;
    return [x0 + norm * ix, y0 + norm * iy];
}
