export const ColorPalette = [
	"#000000",
	"#9fa8b2",
	"#e085f4",
	"#ae3ec9",
	"#4465e9",
	"#4ba1f1",
	"#f1ac4b",
	"#e16919",
	"#099268",
	"#4cb05e",
	"#f87777",
	"#e03131",
];

export type ColorId = number;

export function cssVarBaseColorName(colorId: ColorId) {
	return `--color-${colorId}-base`;
}

export function cssVarBaseColor(colorId: ColorId) {
	return `var(${cssVarBaseColorName(colorId)})`;
}
