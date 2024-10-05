import { assert } from "../lib/assert";
import { randomId } from "../lib/randomId";
import type { Dependency } from "./Dependency";
import { type Obj, type Page, PointKey } from "./Page";

interface CommandBase<T extends string> {
    type: T;
}
interface InsertObjectsCommand extends CommandBase<"INSERT_OBJECTS"> {
    objects: Obj[];
}
interface ReplaceObjectsCommand extends CommandBase<"REPLACE_OBJECTS"> {
    objects: Obj[];
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
    objectId: string;
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
    | ReplaceObjectsCommand
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

    replaceObjects(objects: Obj[]): this {
        this.commands.push({ type: "REPLACE_OBJECTS", objects });
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

    setPointPosition(objectId: string, x: number, y: number): this {
        this.commands.push({ type: "SET_POINT_POSITION", objectId, x, y });
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
        const objectIds = [...this.page.objectIds];
        const dependencies = this.page.dependencies;
        const dirtyObjectIds: string[] = [];

        for (const command of this.commands) {
            switch (command.type) {
                case "INSERT_OBJECTS": {
                    for (const object of command.objects) {
                        objects[object.id] = object;
                        objectIds.push(object.id);
                        dirtyObjectIds.push(object.id);
                    }
                    break;
                }
                case "REPLACE_OBJECTS": {
                    for (const object of command.objects) {
                        objects[object.id] = object;
                        dirtyObjectIds.push(object.id);
                    }
                    break;
                }
                case "DELETE_OBJECTS": {
                    for (const id of command.objectIds) {
                        const object = objects[id];
                        if (object.type === "point") {
                            // Point is not deleted directly. If no longer any lines connected,
                            // point will be deleted automatically
                            continue;
                        }
                        const deps = dependencies.getByToObjectId(id);

                        delete objects[id];

                        const index = objectIds.indexOf(id);
                        assert(index !== -1, `Object not found: ${id}`);
                        objectIds.splice(index, 1);

                        dependencies.deleteByObjectId(id);
                        dirtyObjectIds.push(id);

                        for (const dep of deps) {
                            if (dep.type !== "shapeToPoint") continue;
                            const pointId = dep.from;
                            if (
                                dependencies.getByFromObjectId(pointId)
                                    .length === 0
                            ) {
                                delete objects[pointId];

                                const index = objectIds.indexOf(pointId);
                                assert(
                                    index !== -1,
                                    `Object not found: ${pointId}`,
                                );
                                objectIds.splice(index, 1);

                                dependencies.deleteByObjectId(pointId);
                            }
                            dirtyObjectIds.push(dep.from);
                        }
                    }
                    break;
                }
                case "SCALE_OBJECTS": {
                    const pointIds = new Set<string>();
                    for (const id of command.objectIds) {
                        for (const dep of dependencies
                            .getByToObjectId(id)
                            .filter((dep) => dep.type === "shapeToPoint")) {
                            pointIds.add(dep.from);
                        }
                    }
                    for (const id of pointIds) {
                        const point = objects[id];
                        assert(
                            point.type === "point",
                            `Invalid object type: ${point.type} !== point`,
                        );
                        objects[id] = {
                            ...point,
                            x:
                                (point.x - command.cx) * command.scaleX +
                                command.cx,
                            y:
                                (point.y - command.cy) * command.scaleY +
                                command.cy,
                        };
                        dirtyObjectIds.push(id);
                    }
                    break;
                }
                case "MOVE_OBJECTS": {
                    const pointIds = new Set<string>();
                    for (const id of command.objectIds) {
                        for (const dep of dependencies
                            .getByToObjectId(id)
                            .filter((dep) => dep.type === "shapeToPoint")) {
                            pointIds.add(dep.from);
                        }
                    }
                    for (const id of pointIds) {
                        const point = objects[id];
                        assert(
                            point.type === "point",
                            `Invalid object type: ${point.type} !== point`,
                        );
                        objects[id] = {
                            ...point,
                            x: point.x + command.dx,
                            y: point.y + command.dy,
                        };
                        dirtyObjectIds.push(id);
                    }
                    break;
                }
                case "SET_POINT_POSITION": {
                    const object = objects[command.objectId];
                    assert(
                        object.type === "point",
                        `Invalid object type: ${object.type}`,
                    );
                    objects[command.objectId] = {
                        ...object,
                        x: command.x,
                        y: command.y,
                    };
                    dirtyObjectIds.push(command.objectId);
                    break;
                }
                case "MERGE_POINTS": {
                    const from = objects[command.from];
                    const to = objects[command.to];
                    assert(
                        from.type === "point",
                        `Invalid object type: ${from.type}`,
                    );
                    assert(
                        to.type === "point",
                        `Invalid object type: ${to.type}`,
                    );

                    for (const oldDependency of dependencies.getByFromObjectId(
                        command.from,
                    )) {
                        dependencies.add({
                            ...oldDependency,
                            id: randomId(),
                            from: command.to,
                        });
                    }
                    dependencies.deleteByObjectId(command.from);

                    delete objects[command.from];

                    const index = objectIds.indexOf(command.from);
                    assert(index !== -1, `Object not found: ${command.from}`);
                    objectIds.splice(index, 1);

                    dirtyObjectIds.push(command.to);
                    break;
                }
                case "UPDATE_SHAPE_PROPERTY": {
                    for (const id of command.objectIds) {
                        objects[id] = command.updater(objects[id]);
                        dirtyObjectIds.push(id);
                    }
                    break;
                }
                case "ADD_DEPENDENCY": {
                    dependencies.add(command.dependency);
                    dirtyObjectIds.push(command.dependency.from);
                    break;
                }
                case "DELETE_DEPENDENCIES": {
                    for (const id of command.dependencyIds) {
                        dependencies.deleteById(id);
                    }
                    break;
                }
            }
        }

        for (const dependency of dependencies.collectDependencies(
            dirtyObjectIds,
        )) {
            switch (dependency.type) {
                case "shapeToPoint": {
                    const point = objects[dependency.from];
                    assert(
                        point.type === "point",
                        `Invalid object type: ${point.type}`,
                    );

                    const object = objects[dependency.to];
                    switch (dependency.key) {
                        case PointKey.LINE_P1: {
                            assert(
                                object.type === "line",
                                `Invalid object type: ${object.type} !== line`,
                            );
                            objects[object.id] = {
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
                            objects[object.id] = {
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

                            objects[object.id] = {
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

                            objects[object.id] = {
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
                    break;
                }
                case "pointOnLine": {
                    const r = dependency.r;

                    const line = objects[dependency.from];
                    assert(
                        line.type === "line",
                        `Invalid object type: ${line.type}`,
                    );

                    const point = objects[dependency.to];
                    assert(
                        point.type === "point",
                        `Invalid object type: ${point.type}`,
                    );

                    objects[point.id] = {
                        ...point,
                        x: (1 - r) * line.x1 + r * line.x2,
                        y: (1 - r) * line.y1 + r * line.y2,
                    };
                    break;
                }
                case "pointOnShape": {
                    const { rx, ry } = dependency;

                    const shape = objects[dependency.from];
                    assert(
                        shape.type === "shape",
                        `Invalid object type: ${shape.type}`,
                    );

                    const point = objects[dependency.to];
                    assert(
                        point.type === "point",
                        `Invalid object type: ${point.type}`,
                    );

                    objects[point.id] = {
                        ...point,
                        x: shape.x + rx * shape.width,
                        y: shape.y + ry * shape.height,
                    };
                    break;
                }
            }
        }

        return { objects, objectIds, dependencies };
    }
}
