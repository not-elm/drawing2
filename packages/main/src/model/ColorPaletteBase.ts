export const ColorPaletteBase = [
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
export const ColorPaletteBackground = [
	"#e8e8e8",
	"#eceef0",
	"#f5eafa",
	"#ecdcf2",
	"#dce1f8",
	"#ddedfa",
	"#f9f0e6",
	"#f8e2d4",
	"#d3e9e3",
	"#dbf0e0",
	"#f4dadb",
	"#f4dadb",
];

export type ColorId = number;

export function cssVarBaseColorName(colorId: ColorId) {
	return `--color-${colorId}-base`;
}

export function cssVarBaseColor(colorId: ColorId) {
	return `var(${cssVarBaseColorName(colorId)})`;
}

export function cssVarBackgroundColorName(colorId: ColorId) {
	return `--color-${colorId}-background`;
}

export function cssVarBackgroundColor(colorId: ColorId) {
	return `var(${cssVarBackgroundColorName(colorId)})`;
}

export const cssVarMonoBackgroundColorName = "--color-mono-background";
export const cssVarMonoBackgroundColor = `var(${cssVarMonoBackgroundColorName})`;
export const ColorPaletteMonoColorBackground = "#ffffff";
