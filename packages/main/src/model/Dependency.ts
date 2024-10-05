interface DependencyBase<T extends string> {
    id: string;
    type: T;
    from: string;
    to: string;
}

export interface ObjectToPointDependency
    extends DependencyBase<"objectToPoint"> {
    pointKey: string;
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
    | ObjectToPointDependency
    | PointOnLineDependency
    | PointOnShapeDependency;
