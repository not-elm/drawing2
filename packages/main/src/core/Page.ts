import { assert } from "../lib/assert";
import type { Entity, EntityHandleMap } from "./Entity";
import type { JSONObject } from "./JSONObject";
import { LinkCollection, type SerializedLink } from "./Link";

import type { Rect } from "./shape/Shape";

interface Props {
    entities: Map<string, Entity>;
    entityIds: string[];
    links: LinkCollection;
}

export class Page implements Props {
    entities: Map<string, Entity>;
    entityIds: string[];
    links: LinkCollection;

    constructor(props: Props) {
        this.entities = props.entities;
        this.entityIds = props.entityIds;
        this.links = props.links;
    }

    getEntitiesInRect(rect: Rect, entityHandle: EntityHandleMap): Entity[] {
        return this.entityIds
            .map((entityId) => {
                const entity = this.entities.get(entityId);
                assert(
                    entity !== undefined,
                    `Entity with id ${entityId} not found`,
                );
                return entity;
            })
            .filter((entity) =>
                entityHandle.getShape(entity).isOverlapWith(rect),
            );
    }

    serialize(): SerializedPage {
        return {
            entities: this.entityIds.map((entityId) => {
                const entity = this.entities.get(entityId);
                assert(
                    entity !== undefined,
                    `Entity with id ${entityId} not found`,
                );

                return entity;
            }),
            links: this.links.serialize(),
        };
    }

    static deserialize(page: SerializedPage): Page {
        return new Page({
            entities: new Map(
                page.entities.map((entity) => [entity.id, entity]),
            ),
            entityIds: page.entities.map((entity) => entity.id),
            links: LinkCollection.deserialize(page.links),
        });
    }
}

export interface SerializedPage extends JSONObject {
    entities: Entity[];
    links: SerializedLink[];
}
