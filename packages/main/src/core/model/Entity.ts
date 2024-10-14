export interface EntityBase<T extends string> {
    type: T;
    id: string;
}

export type Entity = EntityBase<string>;
