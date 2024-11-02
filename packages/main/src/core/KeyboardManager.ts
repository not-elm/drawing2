import { EditTextModeController } from "../default/mode/EditTextModeController";
import type { App, NativeKeyboardEvent } from "./App";

export interface KeyboardBinging {
    /**
     * The key that triggers the binding.
     */
    key: Key;

    /**
     * If specified as `true`, the binding will only be active when the control
     * key is pressed. If specified as `false`, the binding will only be active
     * when the control key is **NOT** pressed. If not specified, the control
     * key can be in any state.
     */
    ctrlKey?: boolean;

    /**
     * If specified as `true`, the binding will only be active when the shift
     * key is pressed. If specified as `false`, the binding will only be active
     * when the shift key is **NOT** pressed. If not specified, the shift key
     * can be in any state.
     */
    shiftKey?: boolean;

    /**
     * If specified as `true`, the binding will only be active when the alt
     * key is pressed. If specified as `false`, the binding will only be active
     * when the alt key is **NOT** pressed. If not specified, the alt key can
     * be in any state.
     */
    altKey?: boolean;

    /**
     * If specified as `true`, the binding will only be active when the meta
     * key is pressed. If specified as `false`, the binding will only be active
     * when the meta key is **NOT** pressed. If not specified, the meta key can
     * be in any state.
     */
    metaKey?: boolean;

    /**
     * If specified, the binding will only be active when the app
     * is running on one of the specified platforms. If not specified,
     * the binding will be active on any platform.
     */
    platform?: ("windows" | "macOS" | "other")[];

    /**
     * If specified, the binding will only be active when the app
     * is in one of the specified modes. If not specified, the binding
     * will be active in any modes.
     */
    mode?: string[];

    /**
     * If true, the binding will be active even in `edit-text` mode.
     * Default is `false`.
     */
    enableInEditTextMode?: boolean;

    /**
     * The action to be triggered when the binding is activated.
     * @param app The {@link App} instance
     * @param ev The {@link CanvasKeyboardEvent} instance
     */
    action: (app: App, ev: CanvasKeyboardEvent) => void;
}

export class KeyboardManager {
    private bindings: KeyboardBinging[] = [];

    constructor(private readonly app: App) {}

    /**
     * Add a new keyboard binding.
     * @param binding The definition of the binding
     */
    addBinding(binding: KeyboardBinging): void {
        this.bindings.push(binding);
    }

    /**
     * Handles native `keydown` events and triggers the corresponding binding if needed
     * @internal
     */
    handleKeyDown(ev: NativeKeyboardEvent) {
        const platform = getPlatform();
        const mode = this.app.mode.get();

        for (const binding of this.bindings) {
            if (binding.key !== ev.key) continue;
            if (
                binding.enableInEditTextMode !== true &&
                mode === EditTextModeController.type
            ) {
                continue;
            }
            if ("ctrlKey" in binding && ev.ctrlKey !== binding.ctrlKey)
                continue;
            if ("shiftKey" in binding && ev.shiftKey !== binding.shiftKey)
                continue;
            if ("altKey" in binding && ev.altKey !== binding.altKey) continue;
            if ("metaKey" in binding && ev.metaKey !== binding.metaKey)
                continue;
            if (binding.mode !== undefined && binding.mode.length > 0) {
                if (!binding.mode.includes(mode)) continue;
            }
            if (binding.platform !== undefined && binding.platform.length > 0) {
                if (!binding.platform.includes(platform)) continue;
            }

            ev.preventDefault();
            binding.action(this.app, ev);
        }
    }
}

export interface CanvasKeyboardEvent {
    /**
     * Prevent the default keyboard action in browser.
     */
    preventDefault(): void;
}

export type Key =
    | "a"
    | "b"
    | "c"
    | "d"
    | "e"
    | "f"
    | "g"
    | "h"
    | "i"
    | "j"
    | "k"
    | "l"
    | "m"
    | "n"
    | "o"
    | "p"
    | "q"
    | "r"
    | "s"
    | "t"
    | "u"
    | "v"
    | "w"
    | "x"
    | "y"
    | "z"
    | "0"
    | "1"
    | "2"
    | "3"
    | "4"
    | "5"
    | "6"
    | "7"
    | "8"
    | "9"
    | "Enter"
    | "Escape"
    | "Backspace"
    | "Delete"
    | string;

function getPlatform(): "macOS" | "windows" | "other" {
    // biome-ignore lint/suspicious/noExplicitAny: Use experimental feature navigator.userAgentData
    const nav = navigator as any;
    const userAgent = (
        nav?.userAgentData?.platform ?? navigator.platform
    ).toLowerCase();

    if (userAgent.includes("win")) {
        return "windows";
    } else if (userAgent.includes("mac")) {
        return "macOS";
    }
    return "other";
}
