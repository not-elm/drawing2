export function normalizeAngle(angle: number): number {
    return angle - Math.floor(angle / (2 * Math.PI)) * 2 * Math.PI;
}
