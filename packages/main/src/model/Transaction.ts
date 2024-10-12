import { assert } from "../lib/assert";
import type { Dependency } from "./Dependency";
import type { DependencyCollection } from "./DependencyCollection";
import type { Entity, Page } from "./Page";

interface CommandBase<T extends string> {
    type: T;
}
interface InsertEntitiesCommand extends CommandBase<"INSERT_ENTITIES"> {
    entities: Entity[];
}
interface ReplaceEntitiesCommand extends CommandBase<"REPLACE_ENTITIES"> {
    entities: Entity[];
}
interface DeleteEntitiesCommand extends CommandBase<"DELETE_ENTITIES"> {
    entityIds: string[];
}
interface ScaleEntitiesCommand extends CommandBase<"SCALE_ENTITIES"> {
    entityIds: string[];
    cx: number;
    cy: number;
    scaleX: number;
    scaleY: number;
}
interface MoveEntitiesCommand extends CommandBase<"MOVE_ENTITIES"> {
    entityIds: string[];
    dx: number;
    dy: number;
}
interface SetPointPositionCommand extends CommandBase<"SET_POINT_POSITION"> {
    pathId: string;
    nodeId: string;
    x: number;
    y: number;
}
interface UpdateEntityPropertyCommand
    extends CommandBase<"UPDATE_ENTITY_PROPERTY"> {
    entityIds: string[];
    updater: (entity: Readonly<Entity>) => Entity;
}
interface AddDependenciesCommand extends CommandBase<"ADD_DEPENDENCIES"> {
    dependencies: Dependency[];
}
interface DeleteDependenciesCommand extends CommandBase<"DELETE_DEPENDENCIES"> {
    dependencyIds: string[];
}

type Command =
    | InsertEntitiesCommand
    | ReplaceEntitiesCommand
    | DeleteEntitiesCommand
    | ScaleEntitiesCommand
    | MoveEntitiesCommand
    | SetPointPositionCommand
    | UpdateEntityPropertyCommand
    | AddDependenciesCommand
    | DeleteDependenciesCommand;

export class Transaction {
    private commands: Command[] = [];

    constructor(private readonly page: Page) {}

    insertEntities(entities: Entity[]): this {
        this.commands.push({ type: "INSERT_ENTITIES", entities });
        return this;
    }

    replaceEntities(entities: Entity[]): this {
        this.commands.push({ type: "REPLACE_ENTITIES", entities });
        return this;
    }

    deleteEntities(entityIds: string[]): this {
        this.commands.push({ type: "DELETE_ENTITIES", entityIds });
        return this;
    }

    scaleEntities(
        entityIds: string[],
        cx: number,
        cy: number,
        scaleX: number,
        scaleY: number,
    ): this {
        this.commands.push({
            type: "SCALE_ENTITIES",
            entityIds,
            cx,
            cy,
            scaleX,
            scaleY,
        });
        return this;
    }

    moveEntities(entityIds: string[], dx: number, dy: number): this {
        this.commands.push({ type: "MOVE_ENTITIES", entityIds, dx, dy });
        return this;
    }

    setPointPosition(
        pathId: string,
        nodeId: string,
        x: number,
        y: number,
    ): this {
        this.commands.push({
            type: "SET_POINT_POSITION",
            pathId,
            nodeId,
            x,
            y,
        });
        return this;
    }

    updateProperty(
        entityIds: string[],
        updater: (entity: Readonly<Entity>) => Entity,
    ): this {
        this.commands.push({
            type: "UPDATE_ENTITY_PROPERTY",
            entityIds,
            updater,
        });
        return this;
    }

    addDependencies(dependencies: Dependency[]): this {
        this.commands.push({ type: "ADD_DEPENDENCIES", dependencies });
        return this;
    }

    deleteDependencies(dependencyIds: string[]): this {
        this.commands.push({ type: "DELETE_DEPENDENCIES", dependencyIds });
        return this;
    }

    commit(): Page {
        const draft: PageDraft = {
            entities: { ...this.page.entities },
            entityIds: [...this.page.entityIds],
            dependencies: this.page.dependencies,
            dirtyEntityIds: [],
        };

        for (const command of this.commands) {
            processCommand(command, draft);
        }

        return {
            entities: draft.entities,
            entityIds: draft.entityIds,
            dependencies: draft.dependencies,
        };
    }
}

interface PageDraft {
    entities: Record<string, Entity>;
    entityIds: string[];
    dependencies: DependencyCollection;
    dirtyEntityIds: string[];
}

function processCommand(command: Command, draft: PageDraft) {
    switch (command.type) {
        case "INSERT_ENTITIES": {
            return insertEntities(command, draft);
        }
        case "REPLACE_ENTITIES": {
            return replaceEntities(command, draft);
        }
        case "DELETE_ENTITIES": {
            return deleteEntities(command, draft);
        }
        case "SCALE_ENTITIES": {
            return scaleEntities(command, draft);
        }
        case "MOVE_ENTITIES": {
            return moveEntities(command, draft);
        }
        case "SET_POINT_POSITION": {
            return setPointPosition(command, draft);
        }
        case "UPDATE_ENTITY_PROPERTY": {
            return updateShapeProperty(command, draft);
        }
        case "ADD_DEPENDENCIES": {
            return addDependencies(command, draft);
        }
        case "DELETE_DEPENDENCIES": {
            return deleteDependencies(command, draft);
        }
    }
}

function insertEntities(command: InsertEntitiesCommand, draft: PageDraft) {
    for (const entity of command.entities) {
        draft.entities[entity.id] = entity;
        draft.entityIds.push(entity.id);
        draft.dirtyEntityIds.push(entity.id);
    }
}

function replaceEntities(command: ReplaceEntitiesCommand, draft: PageDraft) {
    for (const entity of command.entities) {
        draft.entities[entity.id] = entity;
        draft.dirtyEntityIds.push(entity.id);
    }
}

function deleteEntities(command: DeleteEntitiesCommand, draft: PageDraft) {
    for (const entityId of command.entityIds) {
        delete draft.entities[entityId];

        const index = draft.entityIds.indexOf(entityId);
        assert(index !== -1, `Entity not found: ${entityId}`);
        draft.entityIds.splice(index, 1);

        draft.dependencies.deleteByEntityId(entityId);
    }
}

function scaleEntities(command: ScaleEntitiesCommand, draft: PageDraft) {
    for (const entityId of command.entityIds) {
        const entity = draft.entities[entityId];
        assert(entity !== undefined, `Entity not found: ${entityId}`);

        switch (entity.type) {
            case "path": {
                draft.entities[entityId] = {
                    ...entity,
                    nodes: Object.fromEntries(
                        Object.entries(entity.nodes).map(([id, node]) => [
                            id,
                            {
                                ...node,
                                x:
                                    command.cx +
                                    command.scaleX * (node.x - command.cx),
                                y:
                                    command.cy +
                                    command.scaleY * (node.y - command.cy),
                            },
                        ]),
                    ),
                };
                break;
            }
            case "shape":
            case "text": {
                draft.entities[entityId] = {
                    ...entity,
                    x: command.cx + command.scaleX * (entity.x - command.cx),
                    y: command.cy + command.scaleY * (entity.y - command.cy),
                    width: entity.width * command.scaleX,
                    height: entity.height * command.scaleY,
                };
                break;
            }
        }

        draft.dirtyEntityIds.push(entity.id);
    }
}

function moveEntities(command: MoveEntitiesCommand, draft: PageDraft) {
    for (const entityId of command.entityIds) {
        const entity = draft.entities[entityId];
        assert(entity !== undefined, `Entity not found: ${entityId}`);

        switch (entity.type) {
            case "path": {
                draft.entities[entityId] = {
                    ...entity,
                    nodes: Object.fromEntries(
                        Object.entries(entity.nodes).map(([id, node]) => [
                            id,
                            {
                                ...node,
                                x: node.x + command.dx,
                                y: node.y + command.dy,
                            },
                        ]),
                    ),
                };
                break;
            }
            case "shape":
            case "text": {
                draft.entities[entityId] = {
                    ...entity,
                    x: entity.x + command.dx,
                    y: entity.y + command.dy,
                };
                break;
            }
        }

        draft.dirtyEntityIds.push(entity.id);
    }
}

function setPointPosition(command: SetPointPositionCommand, draft: PageDraft) {
    const path = draft.entities[command.pathId];
    assert(path !== undefined, `Entity not found: ${command.pathId}`);
    assert(path.type === "path", `Invalid entity type: ${path.type} != path`);

    const newPath = { ...path };
    newPath.nodes[command.nodeId] = {
        ...newPath.nodes[command.nodeId],
        x: command.x,
        y: command.y,
    };
    draft.entities[command.pathId] = newPath;
    draft.dirtyEntityIds.push(command.pathId);
}

function updateShapeProperty(
    command: UpdateEntityPropertyCommand,
    draft: PageDraft,
) {
    for (const id of command.entityIds) {
        draft.entities[id] = command.updater(draft.entities[id]);
        draft.dirtyEntityIds.push(id);
    }
}

function addDependencies(command: AddDependenciesCommand, draft: PageDraft) {
    for (const dependency of command.dependencies) {
        draft.dependencies.add(dependency);
        draft.dirtyEntityIds.push(dependency.from);
    }
}

function deleteDependencies(
    command: DeleteDependenciesCommand,
    draft: PageDraft,
) {
    for (const id of command.dependencyIds) {
        draft.dependencies.deleteById(id);
    }
}
