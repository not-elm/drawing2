export namespace Variables {
    export namespace size {
        export namespace font {
            export const xs = 11;
            export const sm = 12;
            export const md = 14;
        }

        // https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum
        export const minimumTargetSize = 24;

        export namespace borderRadius {
            export const sm = 4;
            export const md = 8;
        }

        export namespace spacing {
            export const xs = 4;
            export const sm = 8;
            export const md = 16;
        }
    }

    export namespace shadow {
        export const sm =
            "0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)";
    }

    export namespace color {
        // 0. Base colors
        export const primary = "#3680f4";
        export const primaryWeak = "#b0c5fb";

        // 1. Semantic colors
        export const foreground = "#404040";
        export const foregroundWeak = "#888";
        export const foregroundSelected = primary;

        export const backgroundContrast = "#fff";
        export const background = "#fcfcfc";
        export const backgroundHover = "#f0f0f0";
        export const backgroundSelected = "#f1f6fd";

        export const border = "#ccc";
        export const borderWeak = "#eee";

        export const outline = primary;

        // 2. Specific colors
        export namespace control {
            export const background = Variables.color.backgroundContrast;

            export const border = primary;
            export const borderHover = primaryWeak;
            export const borderSelected = primary;
        }

        export namespace layoutGuide {
            export const border = "#f00";
        }

        export namespace sidePane {
            export const background = Variables.color.backgroundContrast;

            export const border = Variables.color.border;
        }

        export namespace toolBar {
            export const background = Variables.color.backgroundContrast;

            export const border = Variables.color.border;
        }

        export namespace canvas {
            export const background = "#f9fafc";
        }
    }
}
