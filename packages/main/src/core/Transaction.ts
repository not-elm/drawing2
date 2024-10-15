import { assert } from "../lib/assert";
import type { Point } from "../lib/geo/Point";
import { Transform } from "../lib/geo/Transform";
import type { Dependency } from "./Dependency";
import type { DependencyCollection } from "./DependencyCollection";
import type { Entity } from "./Entity";
import type { Page } from "./Page";

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
interface TransformEntitiesCommand extends CommandBase<"TRANSFORM_ENTITIES"> {
    entityIds: string[];
    transform: Transform;
}
interface SetPointPositionCommand extends CommandBase<"SET_POINT_POSITION"> {
    pathId: string;
    nodeId: string;
    point: Point;
}
interface UpdateEntityPropertyCommand
    extends CommandBase<"UPDATE_ENTITY_PROPERTY"> {
    entityIds: string[];
    key: string;
    value: unknown;
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
    | TransformEntitiesCommand
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
        origin: Point,
        scaleX: number,
        scaleY: number,
    ): this {
        this.commands.push({
            type: "TRANSFORM_ENTITIES",
            entityIds,
            transform: Transform.scale(origin, scaleX, scaleY),
        });
        return this;
    }

    moveEntities(entityIds: string[], dx: number, dy: number): this {
        this.commands.push({
            type: "TRANSFORM_ENTITIES",
            entityIds,
            transform: Transform.translate(dx, dy),
        });
        return this;
    }

    setPointPosition(pathId: string, nodeId: string, point: Point): this {
        this.commands.push({
            type: "SET_POINT_POSITION",
            pathId,
            nodeId,
            point,
        });
        return this;
    }

    updateProperty(entityIds: string[], key: string, value: unknown): this {
        this.commands.push({
            type: "UPDATE_ENTITY_PROPERTY",
            entityIds,
            key,
            value,
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
        case "TRANSFORM_ENTITIES": {
            return transformEntities(command, draft);
        }
        case "SET_POINT_POSITION": {
            return setPointPosition(command, draft);
        }
        case "UPDATE_ENTITY_PROPERTY": {
            return updateEntityProperty(command, draft);
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
        draft.entities[entity.props.id] = entity;
        draft.entityIds.push(entity.props.id);
        draft.dirtyEntityIds.push(entity.props.id);
    }
}

function replaceEntities(command: ReplaceEntitiesCommand, draft: PageDraft) {
    for (const entity of command.entities) {
        draft.entities[entity.props.id] = entity;
        draft.dirtyEntityIds.push(entity.props.id);
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

function transformEntities(
    command: TransformEntitiesCommand,
    draft: PageDraft,
) {
    for (const entityId of command.entityIds) {
        const entity = draft.entities[entityId];
        assert(entity !== undefined, `Entity not found: ${entityId}`);

        draft.entities[entityId] = entity.transform(command.transform);
        draft.dirtyEntityIds.push(entityId);
    }
}

function setPointPosition(command: SetPointPositionCommand, draft: PageDraft) {
    const entity = draft.entities[command.pathId];
    assert(entity !== undefined, `Entity not found: ${command.pathId}`);

    draft.entities[command.pathId] = entity.setNodePosition(
        command.nodeId,
        command.point,
    );
    draft.dirtyEntityIds.push(command.pathId);
}

function updateEntityProperty(
    command: UpdateEntityPropertyCommand,
    draft: PageDraft,
) {
    for (const entityId of command.entityIds) {
        const entity = draft.entities[entityId];
        assert(entity !== undefined, `Entity not found: ${entityId}`);

        draft.entities[entityId] = entity.setProperty(
            command.key,
            command.value,
        );
        draft.dirtyEntityIds.push(entityId);
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
