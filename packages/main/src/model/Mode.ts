export type SelectMode = { type: "select" };
export type TextMode = { type: "text"; objectId: string };
export type NewShapeMode = { type: "shape" };
export type NewLineMode = { type: "line" };

export type Mode = TextMode | NewShapeMode | NewLineMode | SelectMode;
