interface DependencyBase<T extends string> {
	id: string;
	type: T;
	from: string;
	to: string;
}

export interface LineEndPointDependency extends DependencyBase<"lineEndPoint"> {
	lineEnd: 1 | 2;
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

export type Dependency = LineEndPointDependency | PointOnLineDependency;
