import { assert } from "../lib/assert";
import type { Entity } from "./Entity";
import type { JSONObject } from "./JSONObject";

export interface EntityConverter<T extends string = string> {
    serialize(entity: Entity): SerializedEntity<T>;
    deserialize(data: SerializedEntity<T>): Entity;
}

export class EntityConverterMap implements EntityConverter {
    private readonly converters = new Map<string, EntityConverter>();

    register(type: string, converter: EntityConverter): void {
        this.converters.set(type, converter);
    }

    serialize(entity: Entity): SerializedEntity {
        const converter = this.converters.get(entity.type);
        assert(
            converter !== undefined,
            `Converter for type ${entity.props.type} is not found`,
        );

        return converter.serialize(entity);
    }

    deserialize(data: SerializedEntity): Entity {
        const converter = this.converters.get(data.type);
        assert(
            converter !== undefined,
            `Converter for type ${data.type} is not found`,
        );

        return converter.deserialize(data);
    }
}

export interface SerializedEntity<T extends string = string>
    extends JSONObject {
    type: T;
}
