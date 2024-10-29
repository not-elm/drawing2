import type { JSONObject } from "../lib/JSONObject";
import { assert } from "../lib/assert";
import { randomId } from "../lib/randomId";
import type { Entity, EntityHandleMap } from "./Entity";
import type { Page } from "./Page";
import { translate } from "./shape/TransformMatrix";

interface ClipboardData extends JSONObject {
    entities: Entity[];
}

export class ClipboardService {
    constructor(private readonly entityHandle: EntityHandleMap) {}

    copy(page: Page, entityIds: ReadonlySet<string>): Promise<void> {
        const entitiesInOrder: Entity[] = [];

        for (const entityId of page.entityIds) {
            if (!entityIds.has(entityId)) continue;
            const entity = page.entities.get(entityId);
            assert(entity !== undefined, `Entity ${entityId} not found`);

            entitiesInOrder.push(entity);
        }

        const data: ClipboardData = {
            entities: entitiesInOrder,
        };

        return navigator.clipboard.writeText(JSON.stringify(data));
    }

    async paste(): Promise<{
        entities: Entity[];
    }> {
        try {
            const json = await navigator.clipboard.readText();
            const data = JSON.parse(json) as ClipboardData;

            const idMap = new Map<string, string>();

            const entities = data.entities.map((entity) => {
                // Renew IDs
                const newId = randomId();
                idMap.set(entity.id, newId);
                const newEntity = { ...entity, id: newId };

                // Move entities a little bit to avoid overlapping with copy sources
                return this.entityHandle.transform(
                    newEntity,
                    translate(10, 10),
                );
            });

            return {
                entities,
            };
        } catch {
            return {
                entities: [],
            };
        }
    }
}
