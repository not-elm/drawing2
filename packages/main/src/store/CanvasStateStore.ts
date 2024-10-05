import { isLineOverlapWithLine } from "../geo/Line";
import { isRectOverlapWithLine, isRectOverlapWithRect } from "../geo/Rect";
import { Store } from "../lib/Store";
import { assert } from "../lib/assert";
import { CanvasState } from "../model/CanvasState";
import type { ColorId } from "../model/Colors";
import { DependencyCollection } from "../model/DependencyCollection";
import type { FillMode } from "../model/FillMode";
import type { Block, Page } from "../model/Page";
import {
    type SerializedPage,
    deserializePage,
    serializePage,
} from "../model/SerializedPage";
import type { TextAlignment } from "../model/TextAlignment";
import { Transaction } from "../model/Transaction";
import type { Viewport } from "../model/Viewport";
import { ClipboardService } from "../service/ClipboardService";

export class CanvasStateStore extends Store<CanvasState> {
    constructor() {
        super(
            new CanvasState({
                page: {
                    blocks: {},
                    points: {},
                    blockIds: [],
                    dependencies: new DependencyCollection(),
                },
                selectedBlockIds: [],
            }),
        );

        this.loadFromLocalStorage();

        setInterval(() => {
            this.saveToLocalStorage();
        }, 1000);
    }

    deleteBlock(blockIds: string[]) {
        this.setState(
            this.state.setPage(
                new Transaction(this.state.page)
                    .deleteBlocks(blockIds)
                    .commit(),
            ),
        );
    }

    deleteSelectedBlocks() {
        this.deleteBlock(this.state.selectedBlockIds);
    }

    updateZIndex(currentIndex: number, newIndex: number) {
        const newBlockIds = this.state.page.blockIds.slice();
        const [id] = newBlockIds.splice(currentIndex, 1);
        newBlockIds.splice(newIndex, 0, id);

        this.setState(
            this.state.setPage({
                ...this.state.page,
                blockIds: newBlockIds,
            }),
        );
    }

    // Command or Pageをスタックで管理
    undo() {}

    redo() {}

    moveBlocks(blockIds: string[], deltaX: number, deltaY: number) {
        this.setState(
            this.state.setPage(
                new Transaction(this.state.page)
                    .moveBlocks(blockIds, deltaX, deltaY)
                    .commit(),
            ),
        );
    }

    scaleBlocks(
        blockIds: string[],
        scaleX: number,
        scaleY: number,
        originX: number,
        originY: number,
    ) {
        this.setState(
            this.state.setPage(
                new Transaction(this.state.page)
                    .scaleBlocks(blockIds, originX, originY, scaleX, scaleY)
                    .commit(),
            ),
        );
    }

    setLabel(id: string, label: string) {
        this.setState(
            this.state.setPage(
                new Transaction(this.state.page)
                    .updateProperty([id], (oldBlock) => {
                        switch (oldBlock.type) {
                            case "shape": {
                                return { ...oldBlock, label };
                            }
                            case "text": {
                                return { ...oldBlock, content: label };
                            }
                            default: {
                                assert(
                                    false,
                                    `Invalid block type: ${oldBlock.id} ${oldBlock.type}`,
                                );
                            }
                        }
                    })
                    .commit(),
            ),
        );
    }

    setTextAlign(textAlignX: TextAlignment, textAlignY: TextAlignment) {
        this.setState(
            this.state.setPage(
                new Transaction(this.state.page)
                    .updateProperty(this.state.selectedBlockIds, (oldBlock) => {
                        switch (oldBlock.type) {
                            case "shape": {
                                return {
                                    ...oldBlock,
                                    textAlignX,
                                    textAlignY,
                                };
                            }
                            case "text": {
                                return {
                                    ...oldBlock,
                                    textAlignX,
                                };
                            }
                            default: {
                                return oldBlock;
                            }
                        }
                    })
                    .commit(),
            ),
        );
    }

    setColor(colorId: ColorId) {
        this.setState(
            this.state.setPage(
                new Transaction(this.state.page)
                    .updateProperty(this.state.selectedBlockIds, (oldBlock) => {
                        switch (oldBlock.type) {
                            case "shape":
                            case "line": {
                                return { ...oldBlock, colorId };
                            }
                            default: {
                                return oldBlock;
                            }
                        }
                    })
                    .commit(),
            ),
        );
    }

    setFillMode(fillMode: FillMode) {
        this.setState(
            this.state.setPage(
                new Transaction(this.state.page)
                    .updateProperty(this.state.selectedBlockIds, (oldBlock) => {
                        switch (oldBlock.type) {
                            case "shape": {
                                return { ...oldBlock, fillMode };
                            }
                            default: {
                                return oldBlock;
                            }
                        }
                    })
                    .commit(),
            ),
        );
    }

    setLineEndType(lineEnd: 1 | 2, lineEndType: LineEndType) {
        this.setState(
            this.state.setPage(
                new Transaction(this.state.page)
                    .updateProperty(this.state.selectedBlockIds, (oldBlock) => {
                        switch (oldBlock.type) {
                            case "line": {
                                return {
                                    ...oldBlock,
                                    [`endType${lineEnd}`]: lineEndType,
                                };
                            }
                            default: {
                                return oldBlock;
                            }
                        }
                    })
                    .commit(),
            ),
        );
    }

    bringToFront() {
        this.bringForwardOf(this.state.page.blockIds.length - 1);
    }

    bringForward() {
        const selectedIdSet = new Set(this.state.selectedBlockIds);

        let mostBackwardResult = null;
        for (const selectedId of selectedIdSet) {
            const result = this.findForwardOverlappedBlock(
                selectedId,
                selectedIdSet,
            );
            if (result === null) continue;
            if (mostBackwardResult === null) {
                mostBackwardResult = result;
            } else {
                if (result.globalIndex < mostBackwardResult.globalIndex) {
                    mostBackwardResult = result;
                }
            }
        }
        if (mostBackwardResult === null) {
            // selected blocks are already at the front
            return;
        }

        this.bringForwardOf(mostBackwardResult.globalIndex);
    }

    sendToBack() {
        this.sendBackwardOf(0);
    }

    sendBackward() {
        const selectedIdSet = new Set(this.state.selectedBlockIds);

        let mostForwardResult = null;
        for (const selectedId of selectedIdSet) {
            const result = this.findBackwardOverlappedBlock(
                selectedId,
                selectedIdSet,
            );
            if (result === null) continue;
            if (mostForwardResult === null) {
                mostForwardResult = result;
            } else {
                if (result.globalIndex > mostForwardResult.globalIndex) {
                    mostForwardResult = result;
                }
            }
        }
        if (mostForwardResult === null) {
            // selected blocks are already at the front
            return;
        }

        this.sendBackwardOf(mostForwardResult.globalIndex);
    }

    /**
     * Update the z-index of the selected blocks to bring them
     * forward of the target block
     * @param targetBlockZIndex
     */
    private bringForwardOf(targetBlockZIndex: number) {
        const selectedIdSet = new Set(this.state.selectedBlockIds);

        // Current z-index of selected blocks
        const currentIndices = [];
        for (let i = 0; i < this.state.page.blockIds.length; i++) {
            if (selectedIdSet.has(this.state.page.blockIds[i])) {
                currentIndices.push(i);
            }
        }

        for (const currentIndex of currentIndices.toReversed()) {
            if (currentIndex >= targetBlockZIndex) continue;

            this.updateZIndex(currentIndex, targetBlockZIndex);
            targetBlockZIndex -= 1;
        }
    }

    /**
     * Update the z-index of the selected blocks to send them
     * backward of the target block
     * @param targetBlockZIndex
     */
    private sendBackwardOf(targetBlockZIndex: number) {
        const selectedIdSet = new Set(this.state.selectedBlockIds);

        // Current z-index of selected blocks
        const currentIndices = [];
        for (let i = 0; i < this.state.page.blockIds.length; i++) {
            if (selectedIdSet.has(this.state.page.blockIds[i])) {
                currentIndices.push(i);
            }
        }

        for (const currentIndex of currentIndices) {
            if (currentIndex <= targetBlockZIndex) continue;

            this.updateZIndex(currentIndex, targetBlockZIndex);
            targetBlockZIndex += 1;
        }
    }

    /**
     * Find the overlapped block with the given block from the blocks
     * located in front of it, and return the most-backward block.
     */
    private findForwardOverlappedBlock(
        blockId: string,
        ignoreBlockIds: Set<string>,
    ): { blockId: string; globalIndex: number } | null {
        let globalIndex = 0;
        for (; globalIndex < this.state.page.blockIds.length; globalIndex++) {
            if (this.state.page.blockIds[globalIndex] === blockId) break;
        }

        const refBlock = this.state.page.blocks[blockId];
        assert(refBlock !== undefined, "Cannot find the reference block");
        globalIndex++;

        for (; globalIndex < this.state.page.blockIds.length; globalIndex++) {
            const blockId = this.state.page.blockIds[globalIndex];
            if (ignoreBlockIds.has(blockId)) {
                continue;
            }

            const otherBlock = this.state.page.blocks[blockId];

            if (otherBlock === undefined) continue;

            if (isOverlapped(refBlock, otherBlock)) {
                return { blockId: blockId, globalIndex };
            }
        }

        return null;
    }

    /**
     * Find the overlapped block with the given block from the blocks
     * located behind of it, and return the most-forward block.
     */
    private findBackwardOverlappedBlock(
        blockId: string,
        ignoreBlockIds: Set<string>,
    ): { blockId: string; globalIndex: number } | null {
        let globalIndex = this.state.page.blockIds.length - 1;
        for (; globalIndex >= 0; globalIndex--) {
            if (this.state.page.blockIds[globalIndex] === blockId) break;
        }

        const refBlock = this.state.page.blocks[blockId];
        assert(refBlock !== undefined, "Cannot find the reference block");
        globalIndex--;

        for (; globalIndex >= 0; globalIndex--) {
            const blockId = this.state.page.blockIds[globalIndex];
            if (ignoreBlockIds.has(blockId)) {
                continue;
            }

            const otherBlock = this.state.page.blocks[blockId];

            if (otherBlock === undefined) continue;

            if (isOverlapped(refBlock, otherBlock)) {
                return { blockId: blockId, globalIndex };
            }
        }

        return null;
    }
    setPage(page: Page) {
        this.setState(this.state.setPage(page));
    }

    select(id: string) {
        this.setState(this.state.select(id));
    }

    selectAll() {
        this.setState(this.state.selectAll());
    }

    unselect(id: string) {
        this.setState(this.state.unselect(id));
    }

    unselectAll() {
        this.setState(this.state.unselectAll());
    }

    toggleSelect(id: string) {
        if (this.state.selectedBlockIds.includes(id)) {
            this.unselect(id);
        } else {
            this.select(id);
        }
    }

    setSelectedBlockIds(ids: string[]) {
        this.setState(this.state.setSelectedBlockIds(ids));
    }

    copy() {
        if (this.state.selectedBlockIds.length === 0) return;

        ClipboardService.copy(this.state.page, this.state.selectedBlockIds);
    }

    async cut() {
        this.copy();
        this.deleteSelectedBlocks();
    }

    async paste(): Promise<void> {
        const { blocks, points, dependencies } = await ClipboardService.paste();

        this.setState(
            this.state
                .setPage(
                    new Transaction(this.state.page)
                        .insertBlocks(blocks)
                        .insertPoints(points)
                        .addDependencies(dependencies)
                        .commit(),
                )
                .setSelectedBlockIds(blocks.map((block) => block.id)),
        );

        // Copy pasted blocks so that next paste operation will
        // create a new copy of blocks in different position
        this.copy();
    }

    private saveToLocalStorage() {
        const serializedPage = serializePage(this.state.page);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serializedPage));
    }

    private loadFromLocalStorage() {
        try {
            const data = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (data === null) return;

            const serializedPage: SerializedPage = JSON.parse(data);
            const page = deserializePage(serializedPage);

            this.setState(this.state.setPage(page).unselectAll());
        } catch {}
    }
}

export const MouseButton = {
    Left: 0,
    Middle: 1,
    Right: 2,
};

export function fromCanvasCoordinate(
    canvasX: number,
    canvasY: number,
    viewport: Viewport,
): [x: number, y: number] {
    return [
        canvasX / viewport.scale + viewport.x,
        canvasY / viewport.scale + viewport.y,
    ];
}

export function isOverlapped(obj1: Block, obj2: Block): boolean {
    switch (obj1.type) {
        case "shape":
        case "text": {
            switch (obj2.type) {
                case "shape":
                case "text": {
                    return isRectOverlapWithRect(obj1, obj2);
                }
                case "line": {
                    return isRectOverlapWithLine(obj1, obj2);
                }
            }
            break;
        }
        case "line": {
            switch (obj2.type) {
                case "shape":
                case "text": {
                    return isOverlapped(obj2, obj1);
                }
                case "line": {
                    return isLineOverlapWithLine(obj1, obj2);
                }
            }
            break;
        }
    }
}

const LOCAL_STORAGE_KEY = "LocalCanvasStateStore.state.page";

export async function initializeCanvasStateStore(): Promise<CanvasStateStore> {
    return Promise.resolve(new CanvasStateStore());
}
