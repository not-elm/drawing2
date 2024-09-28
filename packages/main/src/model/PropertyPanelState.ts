import { dataclass } from "../lib/dataclass";
import type { TextAlignment } from "./TextAlignment";

export class PropertyPanelState extends dataclass<{
	readonly colorSectionVisible: boolean;
	readonly colorId: number | null;
	readonly textAlignSectionVisible: boolean;
	readonly textAlignX: TextAlignment | null;
	readonly textAlignY: TextAlignment | null;
}>() {}
