import type { Rect } from "../geo/Rect";
import type { EntityBase } from "./Entity";
import type { TextAlignment } from "./TextAlignment";
import type { TextEntitySizingMode } from "./TextEntitySizingMode";

export interface TextEntity extends EntityBase<"text"> {
    // If sizingMode=auto, width and height will be automatically set by application
    rect: Rect;
    sizingMode: TextEntitySizingMode;
    textAlignment: TextAlignment;
    content: string;
}
