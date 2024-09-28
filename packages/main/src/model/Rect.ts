import { dataclass } from "../lib/dataclass";
import type { LineLike } from "./Line";
import { Line } from "./Line";

interface RectLike {
	x: number;
	y: number;
	width: number;
	height: number;
}

export class Rect extends dataclass<RectLike>() {
	isOverlapWithPoint(x: number, y: number): boolean {
		return (
			x >= this.x &&
			x <= this.x + this.width &&
			y >= this.y &&
			y <= this.y + this.height
		);
	}

	isOverlapWithRect(rect: RectLike): boolean {
		return (
			this.x < rect.x + rect.width &&
			this.x + this.width > rect.x &&
			this.y < rect.y + rect.height &&
			this.y + this.height > rect.y
		);
	}

	isOverlapWithLine(line: LineLike): boolean {
		return (
			this.isOverlapWithPoint(line.x1, line.y1) ||
			this.isOverlapWithPoint(line.x2, line.y2) ||
			Line.isOverlap(line, {
				x1: this.x,
				y1: this.y,
				x2: this.x + this.width,
				y2: this.y,
			}) ||
			Line.isOverlap(line, {
				x1: this.x + this.width,
				y1: this.y,
				x2: this.x + this.width,
				y2: this.y + this.height,
			}) ||
			Line.isOverlap(line, {
				x1: this.x + this.width,
				y1: this.y + this.height,
				x2: this.x,
				y2: this.y + this.height,
			}) ||
			Line.isOverlap(line, {
				x1: this.x,
				y1: this.y + this.height,
				x2: this.x,
				y2: this.y,
			})
		);
	}
}
