import { assert } from "../lib/assert";
import { randomId } from "../lib/randomId";
import type {
    Dependency,
    ObjectToPointDependency,
    PointOnLineDependency,
    PointOnShapeDependency,
} from "./Dependency";
import type { DependencyCollection } from "./DependencyCollection";
import { type Obj, type Page, type PointEntity, PointKey } from "./Page";

interface CommandBase<T extends string> {
    type: T;
}
interface InsertObjectsCommand extends CommandBase<"INSERT_OBJECTS"> {
    objects: Obj[];
}
interface InsertPointsCommand extends CommandBase<"INSERT_POINTS"> {
    points: PointEntity[];
}
interface DeleteObjectsCommand extends CommandBase<"DELETE_OBJECTS"> {
    objectIds: string[];
}
interface ScaleObjectsCommand extends CommandBase<"SCALE_OBJECTS"> {
    objectIds: string[];
    cx: number;
    cy: number;
    scaleX: number;
    scaleY: number;
}
interface MoveObjectsCommand extends CommandBase<"MOVE_OBJECTS"> {
    objectIds: string[];
    dx: number;
    dy: number;
}
interface SetPointPositionCommand extends CommandBase<"SET_POINT_POSITION"> {
    pointId: string;
    x: number;
    y: number;
}

/**
 * Merge the point `from` into the point `to`. The point `from` will be deleted.
 */
interface MergePointsCommand extends CommandBase<"MERGE_POINTS"> {
    from: string;
    to: string;
}
interface UpdateObjectPropertyCommand
    extends CommandBase<"UPDATE_SHAPE_PROPERTY"> {
    objectIds: string[];
    updater: (object: Readonly<Obj>) => Obj;
}
interface AddDependencyCommand extends CommandBase<"ADD_DEPENDENCY"> {
    dependency: Dependency;
}
interface DeleteDependenciesCommand extends CommandBase<"DELETE_DEPENDENCIES"> {
    dependencyIds: string[];
}

type Command =
    | InsertObjectsCommand
    | InsertPointsCommand
    | DeleteObjectsCommand
    | ScaleObjectsCommand
    | MoveObjectsCommand
    | SetPointPositionCommand
    | MergePointsCommand
    | UpdateObjectPropertyCommand
    | AddDependencyCommand
    | DeleteDependenciesCommand;

export class Transaction {
    private commands: Command[] = [];

    constructor(private readonly page: Page) {}

    insertObjects(objects: Obj[]): this {
        this.commands.push({ type: "INSERT_OBJECTS", objects });
        return this;
    }

    insertPoints(points: PointEntity[]): this {
        this.commands.push({ type: "INSERT_POINTS", points });
        return this;
    }

    deleteObjects(objectIds: string[]): this {
        this.commands.push({ type: "DELETE_OBJECTS", objectIds });
        return this;
    }

    scaleObjects(
        objectIds: string[],
        cx: number,
        cy: number,
        scaleX: number,
        scaleY: number,
    ): this {
        this.commands.push({
            type: "SCALE_OBJECTS",
            objectIds,
            cx,
            cy,
            scaleX,
            scaleY,
        });
        return this;
    }

    moveObjects(objectIds: string[], dx: number, dy: number): this {
        this.commands.push({ type: "MOVE_OBJECTS", objectIds, dx, dy });
        return this;
    }

    setPointPosition(pointId: string, x: number, y: number): this {
        this.commands.push({ type: "SET_POINT_POSITION", pointId, x, y });
        return this;
    }

    mergePoints(from: string, to: string): this {
        this.commands.push({ type: "MERGE_POINTS", from, to });
        return this;
    }

    updateProperty(
        objectIds: string[],
        updater: (object: Readonly<Obj>) => Obj,
    ): this {
        this.commands.push({
            type: "UPDATE_SHAPE_PROPERTY",
            objectIds,
            updater,
        });
        return this;
    }

    addDependency(dependency: Dependency): this {
        this.commands.push({ type: "ADD_DEPENDENCY", dependency });
        return this;
    }

    deleteDependencies(dependencyIds: string[]): this {
        this.commands.push({ type: "DELETE_DEPENDENCIES", dependencyIds });
        return this;
    }

    commit(): Page {
        const objects: Record<string, Obj> = { ...this.page.objects };
        const points: Record<string, PointEntity> = { ...this.page.points };
        const objectIds = [...this.page.objectIds];
        const dependencies = this.page.dependencies;
        const dirtyEntityIds: string[] = [];

        const draft: PageDraft = {
            objects,
            points,
            objectIds,
            dependencies,
            dirtyEntityIds,
        };

        for (const command of this.commands) {
            switch (command.type) {
                case "INSERT_OBJECTS": {
                    insertObjects(command, draft);
                    break;
                }
                case "INSERT_POINTS": {
                    insertPoints(command, draft);
                    break;
                }
                case "DELETE_OBJECTS": {
                    deleteObjects(command, draft);
                    break;
                }
                case "SCALE_OBJECTS": {
                    scaleObjects(command, draft);
                    break;
                }
                case "MOVE_OBJECTS": {
                    moveObjects(command, draft);
                    break;
                }
                case "SET_POINT_POSITION": {
                    setPointPosition(command, draft);
                    break;
                }
                case "MERGE_POINTS": {
                    mergePoints(command, draft);
                    break;
                }
                case "UPDATE_SHAPE_PROPERTY": {
                    updateShapeProperty(command, draft);
                    break;
                }
                case "ADD_DEPENDENCY": {
                    addDependency(command, draft);
                    break;
                }
                case "DELETE_DEPENDENCIES": {
                    deleteDependencies(command, draft);
                    break;
                }
            }
        }

        for (const dependency of dependencies.collectDependencies(
            dirtyEntityIds,
        )) {
            switch (dependency.type) {
                case "objectToPoint": {
                    recomputeObjectToPointDependency(dependency, draft);
                    break;
                }
                case "pointOnLine": {
                    recomputePointOnLineDependency(dependency, draft);
                    break;
                }
                case "pointOnShape": {
                    recomputePointOnShapeDependency(dependency, draft);
                    break;
                }
            }
        }

        return { objects, points, objectIds, dependencies };
    }
}

interface PageDraft {
    objects: Record<string, Obj>;
    points: Record<string, PointEntity>;
    objectIds: string[];
    dependencies: DependencyCollection;
    dirtyEntityIds: string[];
}

function insertObjects(command: InsertObjectsCommand, draft: PageDraft) {
    for (const object of command.objects) {
        draft.objects[object.id] = object;
        draft.objectIds.push(object.id);
        draft.dirtyEntityIds.push(object.id);
    }
}

function insertPoints(command: InsertPointsCommand, draft: PageDraft) {
    for (const point of command.points) {
        draft.points[point.id] = point;
        draft.dirtyEntityIds.push(point.id);
    }
}

function deleteObjects(command: DeleteObjectsCommand, draft: PageDraft) {
    for (const objectId of command.objectIds) {
        const deps = draft.dependencies.getByToEntityId(objectId);

        delete draft.objects[objectId];

        const index = draft.objectIds.indexOf(objectId);
        assert(index !== -1, `Object not found: ${objectId}`);
        draft.objectIds.splice(index, 1);

        draft.dependencies.deleteByEntityId(objectId);

        // Clean up points with no more dependencies
        for (const dep of deps) {
            if (dep.type !== "objectToPoint") continue;
            const pointId = dep.from;
            if (draft.dependencies.getByFromEntityId(pointId).length === 0) {
                deletePoint(pointId, draft);
            }
        }
    }
}

function deletePoint(pointId: string, draft: PageDraft) {
    delete draft.points[pointId];
    draft.dependencies.deleteByEntityId(pointId);
}

function scaleObjects(command: ScaleObjectsCommand, draft: PageDraft) {
    const pointIds = new Set<string>();
    for (const objectId of command.objectIds) {
        for (const dep of draft.dependencies
            .getByToEntityId(objectId)
            .filter((dep) => dep.type === "objectToPoint")) {
            pointIds.add(dep.from);
        }
    }
    for (const pointId of pointIds) {
        const point = draft.points[pointId];
        draft.points[pointId] = {
            ...point,
            x: (point.x - command.cx) * command.scaleX + command.cx,
            y: (point.y - command.cy) * command.scaleY + command.cy,
        };
        draft.dirtyEntityIds.push(pointId);
    }
}

function moveObjects(command: MoveObjectsCommand, draft: PageDraft) {
    const pointIds = new Set<string>();
    for (const objectId of command.objectIds) {
        for (const dep of draft.dependencies
            .getByToEntityId(objectId)
            .filter((dep) => dep.type === "objectToPoint")) {
            pointIds.add(dep.from);
        }
    }
    for (const pointId of pointIds) {
        const point = draft.points[pointId];
        draft.points[pointId] = {
            ...point,
            x: point.x + command.dx,
            y: point.y + command.dy,
        };
        draft.dirtyEntityIds.push(pointId);
    }
}

function setPointPosition(command: SetPointPositionCommand, draft: PageDraft) {
    const point = draft.points[command.pointId];
    draft.points[command.pointId] = {
        ...point,
        x: command.x,
        y: command.y,
    };
    draft.dirtyEntityIds.push(command.pointId);
}

function mergePoints(command: MergePointsCommand, draft: PageDraft) {
    for (const oldDependency of draft.dependencies.getByFromEntityId(
        command.from,
    )) {
        draft.dependencies.add({
            ...oldDependency,
            id: randomId(),
            from: command.to,
        });
    }
    draft.dependencies.deleteByEntityId(command.from);
    delete draft.points[command.from];

    draft.dirtyEntityIds.push(command.to);
}

function updateShapeProperty(
    command: UpdateObjectPropertyCommand,
    draft: PageDraft,
) {
    for (const id of command.objectIds) {
        draft.objects[id] = command.updater(draft.objects[id]);
        draft.dirtyEntityIds.push(id);
    }
}

function addDependency(command: AddDependencyCommand, draft: PageDraft) {
    draft.dependencies.add(command.dependency);
    draft.dirtyEntityIds.push(command.dependency.from);
}

function deleteDependencies(
    command: DeleteDependenciesCommand,
    draft: PageDraft,
) {
    for (const id of command.dependencyIds) {
        draft.dependencies.deleteById(id);
    }
}

function recomputeObjectToPointDependency(
    dependency: ObjectToPointDependency,
    draft: PageDraft,
) {
    const point = draft.points[dependency.from];
    const object = draft.objects[dependency.to];
    switch (dependency.pointKey) {
        case PointKey.LINE_P1: {
            assert(
                object.type === "line",
                `Invalid object type: ${object.type} !== line`,
            );
            draft.objects[object.id] = {
                ...object,
                x1: point.x,
                y1: point.y,
            };
            break;
        }
        case PointKey.LINE_P2: {
            assert(
                object.type === "line",
                `Invalid object type: ${object.type} !== line`,
            );
            draft.objects[object.id] = {
                ...object,
                x2: point.x,
                y2: point.y,
            };
            break;
        }
        case PointKey.SHAPE_P1: {
            assert(
                object.type === "shape",
                `Invalid object type: ${object.type} !== shape`,
            );

            const x1 = point.x;
            const x2 = object.x2;
            const y1 = point.y;
            const y2 = object.y2;
            const x = Math.min(x1, x2);
            const y = Math.min(y1, y2);
            const width = Math.abs(x1 - x2);
            const height = Math.abs(y1 - y2);

            draft.objects[object.id] = {
                ...object,
                x,
                y,
                width,
                height,
                x1,
                x2,
                y1,
                y2,
            };
            break;
        }
        case PointKey.SHAPE_P2: {
            assert(
                object.type === "shape",
                `Invalid object type: ${object.type} !== shape`,
            );

            const x1 = object.x1;
            const x2 = point.x;
            const y1 = object.y1;
            const y2 = point.y;
            const x = Math.min(x1, x2);
            const y = Math.min(y1, y2);
            const width = Math.abs(x1 - x2);
            const height = Math.abs(y1 - y2);

            draft.objects[object.id] = {
                ...object,
                x,
                y,
                width,
                height,
                x1,
                x2,
                y1,
                y2,
            };
            break;
        }
    }
}

function recomputePointOnLineDependency(
    dependency: PointOnLineDependency,
    draft: PageDraft,
) {
    const r = dependency.r;

    const line = draft.objects[dependency.from];
    assert(line.type === "line", `Invalid object type: ${line.type}`);

    const point = draft.points[dependency.to];

    draft.points[point.id] = {
        ...point,
        x: (1 - r) * line.x1 + r * line.x2,
        y: (1 - r) * line.y1 + r * line.y2,
    };
}

function recomputePointOnShapeDependency(
    dependency: PointOnShapeDependency,
    draft: PageDraft,
) {
    const { rx, ry } = dependency;

    const shape = draft.objects[dependency.from];
    assert(shape.type === "shape", `Invalid object type: ${shape.type}`);

    const point = draft.points[dependency.to];
    draft.points[point.id] = {
        ...point,
        x: shape.x + rx * shape.width,
        y: shape.y + ry * shape.height,
    };
}
