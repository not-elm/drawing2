/**
 * Computes the parameter of affine transformation from 2 gesture points
 */
function computeAffineParameter(
    sx0: number,
    sy0: number,
    sx1: number,
    sy1: number,
    cx0: number,
    cy0: number,
    cx1: number,
    cy1: number,
): {
    // translation
    tx: number;
    ty: number;

    // scaling
    scale: number;

    // rotation
    cosR: number;
    sinR: number;
} {
    const tx = (cx0 - sx0 + cx1 - sx1) / 2;
    const ty = (cy0 - sy0 + cy1 - sy1) / 2;

    const dsx = sx0 - sx1;
    const dsy = sy0 - sy1;
    const dcx = cx0 - cx1;
    const dcy = cy0 - cy1;

    const dsNorm = Math.hypot(dsx, dsy);
    const dcNorm = Math.hypot(dcx, dcy);

    const scale = dcNorm / dsNorm;
    const cosR = (dsx * dcx + dsy * dcy) / (dsNorm * dcNorm);
    const sinR = (dsx * dcy - dsy * dcx) / (dsNorm * dcNorm);

    return { tx, ty, scale, cosR, sinR };
}
