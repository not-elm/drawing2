interface DependencyBase<T extends string> {
    id: string;
    type: T;
    from: string;
    to: string;
}

export interface PointOnShapeDependency extends DependencyBase<"pointOnShape"> {
    rx: number;
    ry: number;
}

export type Dependency = PointOnShapeDependency;

export type SerializedDependency = SerializedPointOnShapeDependency;
export function serializeDependency(
    dependency: Dependency,
): SerializedDependency {
    switch (dependency.type) {
        case "pointOnShape":
            return serializePointOnShapeDependency(dependency);
    }
}
export function deserializeDependency(
    dependency: SerializedDependency,
): Dependency {
    switch (dependency.type) {
        case "pointOnShape":
            return deserializePointOnShapeDependency(dependency);
    }
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
