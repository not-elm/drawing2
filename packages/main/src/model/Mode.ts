export type SelectMode = { type: "select" };
export type TextMode = { type: "edit-text"; blockId: string };
export type NewShapeMode = { type: "new-shape" };
export type NewPathMode = { type: "new-path" };
export type NewTextMode = { type: "new-text" };

export type Mode =
    | TextMode
    | NewShapeMode
    | NewPathMode
    | NewTextMode
    | SelectMode;
