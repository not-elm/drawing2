export type SelectMode = { type: "select" };
export type TextMode = { type: "edit-text"; blockId: string };
export type NewShapeMode = { type: "new-shape" };
export type NewLineMode = { type: "new-line" };
export type NewTextMode = { type: "new-text" };

export type Mode =
    | TextMode
    | NewShapeMode
    | NewLineMode
    | NewTextMode
    | SelectMode;
