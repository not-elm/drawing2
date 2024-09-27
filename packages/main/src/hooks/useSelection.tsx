import { useState } from "react";
import { isNullish } from "../lib/isNullish";
import type { Line } from "../model/Line";
import type { Page } from "../model/Page";
import type { Rect } from "../model/Rect";

export interface SelectionState {
	selected: boolean;
	rect: Rect | null;
	line: Line | null;
	select: (id: string | null) => void;
}

export function useSelection(page: Page): SelectionState {
	const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);

	const rect = page.rects.find((rect) => rect.id === selectedShapeId) ?? null;
	const line = page.lines.find((line) => line.id === selectedShapeId) ?? null;

	return {
		selected: !isNullish(rect ?? line),
		rect,
		line,
		select: setSelectedShapeId,
	};
}
