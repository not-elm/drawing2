import type { PointKey } from "./Page";

interface DependencyBase<T extends string> {
    id: string;
    type: T;
    from: string;
    to: string;
}

export interface BlockToPointDependency extends DependencyBase<"blockToPoint"> {
    pointKey: (typeof PointKey)[keyof typeof PointKey];
}

export interface PointOnLineDependency extends DependencyBase<"pointOnLine"> {
    /**
     * The ratio of the distance from the start point to the point.
     * The position of the point is calculated as follows:
     *
     * 		(position) = (1 - r) * (start point) + r * (end point)
     *
     */
    r: number;
}

export interface PointOnShapeDependency extends DependencyBase<"pointOnShape"> {
    rx: number;
    ry: number;
}

export type Dependency =
    | BlockToPointDependency
    | PointOnLineDependency
    | PointOnShapeDependency;

export type SerializedDependency =
    | SerializedBlockToPointDependency
    | SerializedPointOnLineDependency
    | SerializedPointOnShapeDependency;
export function serializeDependency(
    dependency: Dependency,
): SerializedDependency {
    switch (dependency.type) {
        case "blockToPoint":
            return serializeBlockToPointDependency(dependency);
        case "pointOnLine":
            return serializePointOnLineDependency(dependency);
        case "pointOnShape":
            return serializePointOnShapeDependency(dependency);
    }
}
export function deserializeDependency(
    dependency: SerializedDependency,
): Dependency {
    switch (dependency.type) {
        case "blockToPoint":
            return deserializeBlockToPointDependency(dependency);
        case "pointOnLine":
            return deserializePointOnLineDependency(dependency);
        case "pointOnShape":
            return deserializePointOnShapeDependency(dependency);
    }
}

interface SerializedBlockToPointDependency {
    id: string;
    type: "blockToPoint";
    from: string;
    to: string;
    pointKey: string;
}
function serializeBlockToPointDependency(
    dependency: BlockToPointDependency,
): SerializedBlockToPointDependency {
    return {
        id: dependency.id,
        type: "blockToPoint",
        from: dependency.from,
        to: dependency.to,
        pointKey: dependency.pointKey,
    };
}
function deserializeBlockToPointDependency(
    dependency: SerializedBlockToPointDependency,
): BlockToPointDependency {
    return {
        id: dependency.id,
        type: "blockToPoint",
        from: dependency.from,
        to: dependency.to,
        pointKey: dependency.pointKey,
    };
}

interface SerializedPointOnLineDependency {
    id: string;
    type: "pointOnLine";
    from: string;
    to: string;
    r: number;
}
function serializePointOnLineDependency(
    dependency: PointOnLineDependency,
): SerializedPointOnLineDependency {
    return {
        id: dependency.id,
        type: "pointOnLine",
        from: dependency.from,
        to: dependency.to,
        r: dependency.r,
    };
}
function deserializePointOnLineDependency(
    dependency: SerializedPointOnLineDependency,
): PointOnLineDependency {
    return {
        id: dependency.id,
        type: "pointOnLine",
        from: dependency.from,
        to: dependency.to,
        r: dependency.r,
    };
}

interface SerializedPointOnShapeDependency {
    id: string;
    type: "pointOnShape";
    from: string;
    to: string;
    rx: number;
    ry: number;
}
function serializePointOnShapeDependency(
    dependency: PointOnShapeDependency,
): SerializedPointOnShapeDependency {
    return {
        id: dependency.id,
        type: "pointOnShape",
        from: dependency.from,
        to: dependency.to,
        rx: dependency.rx,
        ry: dependency.ry,
    };
}
function deserializePointOnShapeDependency(
    dependency: SerializedPointOnShapeDependency,
): PointOnShapeDependency {
    return {
        id: dependency.id,
        type: "pointOnShape",
        from: dependency.from,
        to: dependency.to,
        rx: dependency.rx,
        ry: dependency.ry,
    };
}
