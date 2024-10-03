import { dataclass } from "../lib/dataclass";
import type { FillMode } from "./FillMode";
import type { TextAlignment } from "./TextAlignment";

export class PropertyPanelState extends dataclass<{
    readonly colorSectionVisible: boolean;
    readonly colorId: number | null;
    readonly fillModeSectionVisible: boolean;
    readonly fillMode: FillMode | null;
    readonly textAlignSectionVisible: boolean;
    readonly textAlignX: TextAlignment | null;
    readonly textAlignY: TextAlignment | null;
    readonly orderSectionVisible: boolean;
}>() {}
