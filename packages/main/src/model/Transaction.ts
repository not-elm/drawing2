import { assert } from "../lib/assert";
import type { Dependency, PointOnShapeDependency } from "./Dependency";
import type { DependencyCollection } from "./DependencyCollection";
import type { Block, Page } from "./Page";

interface CommandBase<T extends string> {
    type: T;
}
interface InsertBlocksCommand extends CommandBase<"INSERT_BLOCKS"> {
    blocks: Block[];
}
interface ReplaceBlocksCommand extends CommandBase<"REPLACE_BLOCKS"> {
    blocks: Block[];
}
interface DeleteBlocksCommand extends CommandBase<"DELETE_BLOCKS"> {
    blockIds: string[];
}
interface ScaleBlocksCommand extends CommandBase<"SCALE_BLOCKS"> {
    blockIds: string[];
    cx: number;
    cy: number;
    scaleX: number;
    scaleY: number;
}
interface MoveBlocksCommand extends CommandBase<"MOVE_BLOCKS"> {
    blockIds: string[];
    dx: number;
    dy: number;
}
interface SetPointPositionCommand extends CommandBase<"SET_POINT_POSITION"> {
    pathId: string;
    nodeId: string;
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
interface UpdateBlockPropertyCommand
    extends CommandBase<"UPDATE_BLOCK_PROPERTY"> {
    blockIds: string[];
    updater: (block: Readonly<Block>) => Block;
}
interface AddDependenciesCommand extends CommandBase<"ADD_DEPENDENCIES"> {
    dependencies: Dependency[];
}
interface DeleteDependenciesCommand extends CommandBase<"DELETE_DEPENDENCIES"> {
    dependencyIds: string[];
}

type Command =
    | InsertBlocksCommand
    | ReplaceBlocksCommand
    | DeleteBlocksCommand
    | ScaleBlocksCommand
    | MoveBlocksCommand
    | SetPointPositionCommand
    | MergePointsCommand
    | UpdateBlockPropertyCommand
    | AddDependenciesCommand
    | DeleteDependenciesCommand;

export class Transaction {
    private commands: Command[] = [];

    constructor(private readonly page: Page) {}

    insertBlocks(blocks: Block[]): this {
        this.commands.push({ type: "INSERT_BLOCKS", blocks });
        return this;
    }

    replaceBlocks(blocks: Block[]): this {
        this.commands.push({ type: "REPLACE_BLOCKS", blocks });
        return this;
    }

    deleteBlocks(blockIds: string[]): this {
        this.commands.push({ type: "DELETE_BLOCKS", blockIds });
        return this;
    }

    scaleBlocks(
        blockIds: string[],
        cx: number,
        cy: number,
        scaleX: number,
        scaleY: number,
    ): this {
        this.commands.push({
            type: "SCALE_BLOCKS",
            blockIds,
            cx,
            cy,
            scaleX,
            scaleY,
        });
        return this;
    }

    moveBlocks(blockIds: string[], dx: number, dy: number): this {
        this.commands.push({ type: "MOVE_BLOCKS", blockIds, dx, dy });
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

    mergePoints(from: string, to: string): this {
        this.commands.push({ type: "MERGE_POINTS", from, to });
        return this;
    }

    updateProperty(
        blockIds: string[],
        updater: (block: Readonly<Block>) => Block,
    ): this {
        this.commands.push({
            type: "UPDATE_BLOCK_PROPERTY",
            blockIds,
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
            blocks: { ...this.page.blocks },
            blockIds: [...this.page.blockIds],
            dependencies: this.page.dependencies,
            dirtyEntityIds: [],
        };

        for (const command of this.commands) {
            processCommand(command, draft);
        }

        for (const dependency of draft.dependencies.collectDependencies(
            draft.dirtyEntityIds,
        )) {
            switch (dependency.type) {
                case "pointOnShape": {
                    recomputePointOnShapeDependency(dependency, draft);
                    break;
                }
            }
        }

        return {
            blocks: draft.blocks,
            blockIds: draft.blockIds,
            dependencies: draft.dependencies,
        };
    }
}

interface PageDraft {
    blocks: Record<string, Block>;
    blockIds: string[];
    dependencies: DependencyCollection;
    dirtyEntityIds: string[];
}

function processCommand(command: Command, draft: PageDraft) {
    switch (command.type) {
        case "INSERT_BLOCKS": {
            return insertBlocks(command, draft);
        }
        case "REPLACE_BLOCKS": {
            return replaceBlocks(command, draft);
        }
        case "DELETE_BLOCKS": {
            return deleteBlocks(command, draft);
        }
        case "SCALE_BLOCKS": {
            return scaleBlocks(command, draft);
        }
        case "MOVE_BLOCKS": {
            return moveBlocks(command, draft);
        }
        case "SET_POINT_POSITION": {
            return setPointPosition(command, draft);
        }
        case "MERGE_POINTS": {
            return mergePoints(command, draft);
        }
        case "UPDATE_BLOCK_PROPERTY": {
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

function insertBlocks(command: InsertBlocksCommand, draft: PageDraft) {
    for (const block of command.blocks) {
        draft.blocks[block.id] = block;
        draft.blockIds.push(block.id);
        draft.dirtyEntityIds.push(block.id);
    }
}

function replaceBlocks(command: ReplaceBlocksCommand, draft: PageDraft) {
    for (const block of command.blocks) {
        draft.blocks[block.id] = block;
        draft.dirtyEntityIds.push(block.id);
    }
}

function deleteBlocks(command: DeleteBlocksCommand, draft: PageDraft) {
    for (const blockId of command.blockIds) {
        const deps = draft.dependencies.getByToEntityId(blockId);

        delete draft.blocks[blockId];

        const index = draft.blockIds.indexOf(blockId);
        assert(index !== -1, `Block not found: ${blockId}`);
        draft.blockIds.splice(index, 1);

        draft.dependencies.deleteByEntityId(blockId);
    }
}

function scaleBlocks(command: ScaleBlocksCommand, draft: PageDraft) {
    for (const blockId of command.blockIds) {
        const block = draft.blocks[blockId];
        assert(block !== undefined, `Block not found: ${blockId}`);

        switch (block.type) {
            case "path": {
                draft.blocks[blockId] = {
                    ...block,
                    nodes: Object.fromEntries(
                        Object.entries(block.nodes).map(([id, node]) => [
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
                draft.blocks[blockId] = {
                    ...block,
                    x: command.cx + command.scaleX * (block.x - command.cx),
                    y: command.cy + command.scaleY * (block.y - command.cy),
                    width: block.width * command.scaleX,
                    height: block.height * command.scaleY,
                };
                break;
            }
        }

        draft.dirtyEntityIds.push(block.id);
    }
}

function moveBlocks(command: MoveBlocksCommand, draft: PageDraft) {
    for (const blockId of command.blockIds) {
        const block = draft.blocks[blockId];
        assert(block !== undefined, `Block not found: ${blockId}`);

        switch (block.type) {
            case "path": {
                draft.blocks[blockId] = {
                    ...block,
                    nodes: Object.fromEntries(
                        Object.entries(block.nodes).map(([id, node]) => [
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
                draft.blocks[blockId] = {
                    ...block,
                    x: block.x + command.dx,
                    y: block.y + command.dy,
                };
                break;
            }
        }

        draft.dirtyEntityIds.push(block.id);
    }
}

function setPointPosition(command: SetPointPositionCommand, draft: PageDraft) {
    const path = draft.blocks[command.pathId];
    assert(path !== undefined, `Block not found: ${command.pathId}`);
    assert(path.type === "path", `Invalid block type: ${path.type} != path`);

    const newPath = { ...path };
    newPath.nodes[command.nodeId] = {
        ...newPath.nodes[command.nodeId],
        x: command.x,
        y: command.y,
    };
    draft.blocks[command.pathId] = newPath;
    draft.dirtyEntityIds.push(command.pathId);
}

function mergePoints(command: MergePointsCommand, draft: PageDraft) {
    throw new Error("TODO(merge point)");
    // for (const oldDependency of draft.dependencies.getByFromEntityId(
    //     command.from,
    // )) {
    //     draft.dependencies.add({
    //         ...oldDependency,
    //         id: randomId(),
    //         from: command.to,
    //     });
    // }
    // draft.dependencies.deleteByEntityId(command.from);
    // delete draft.points[command.from];
    //
    // draft.dirtyEntityIds.push(command.to);
}

function updateShapeProperty(
    command: UpdateBlockPropertyCommand,
    draft: PageDraft,
) {
    for (const id of command.blockIds) {
        draft.blocks[id] = command.updater(draft.blocks[id]);
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

function recomputePointOnShapeDependency(
    dependency: PointOnShapeDependency,
    draft: PageDraft,
) {
    throw new Error("TODO(link)");
    // const { rx, ry } = dependency;
    //
    // const shape = draft.blocks[dependency.from];
    // assert(
    //     shape.type === "shape" || shape.type === "text",
    //     `Invalid block type: ${shape.type} != (shape or text)`,
    // );
    //
    // const point = draft.points[dependency.to];
    // draft.points[point.id] = {
    //     ...point,
    //     x: shape.x + rx * shape.width,
    //     y: shape.y + ry * shape.height,
    // };
}
