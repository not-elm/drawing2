export type SelectMode = { type: "select" };
export type TextMode = { type: "text"; blockId: string };
export type NewShapeMode = { type: "shape" };
export type NewLineMode = { type: "line" };
export type NewTextMode = { type: "new-text" };

export type Mode =
    | TextMode
    | NewShapeMode
    | NewLineMode
    | NewTextMode
    | SelectMode;
