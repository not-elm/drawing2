import { assert } from "../lib/assert";
import type { Rect } from "../lib/geo/Rect";
import type { Entity } from "./Entity";
import type { EntityConverter, SerializedEntity } from "./EntityConverter";
import type { JSONObject } from "./JSONObject";
import { LinkCollection, type SerializedLink } from "./Link";

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

    getEntitiesInRect(rect: Rect): Entity[] {
        return this.entityIds
            .map((entityId) => {
                const entity = this.entities.get(entityId);
                assert(
                    entity !== undefined,
                    `Entity with id ${entityId} not found`,
                );
                return entity;
            })
            .filter((entity) => entity.isOverlapWith(rect));
    }

    serialize(): SerializedPage {
        return {
            entities: this.entityIds.map((entityId) => {
                const entity = this.entities.get(entityId);
                assert(
                    entity !== undefined,
                    `Entity with id ${entityId} not found`,
                );

                return entity.serialize();
            }),
            links: this.links.serialize(),
        };
    }

    static deserialize(
        page: SerializedPage,
        entityConverter: EntityConverter,
    ): Page {
        const entities = page.entities.map((data) =>
            entityConverter.deserialize(data),
        );

        return new Page({
            entities: new Map(
                entities.map((entity) => [entity.props.id, entity]),
            ),
            entityIds: entities.map((entity) => entity.props.id),
            links: LinkCollection.deserialize(page.links),
        });
    }
}

export interface SerializedPage extends JSONObject {
    entities: SerializedEntity[];
    links: SerializedLink[];
}
