import { useEffect, useReducer } from "react";
import { SelectableText } from "../SelectableText";
import { useApp } from "../hooks/useApp";
import { useCell } from "../hooks/useCell";
import { PropertyPane } from "./PropertyPane";

const SIZE = 1000; // [ms]

const frameCommitTimingBucket: number[] = [];

function update() {
    const now = performance.now();
    while (
        frameCommitTimingBucket.length > 0 &&
        frameCommitTimingBucket[0] <= now - SIZE
    ) {
        frameCommitTimingBucket.shift();
    }
    frameCommitTimingBucket.push(now);

    requestAnimationFrame(update);
}

export function monitorFPS() {
    requestAnimationFrame(update);
}

export function getFPS() {
    const duration =
        frameCommitTimingBucket.length <= 1
            ? SIZE
            : frameCommitTimingBucket[frameCommitTimingBucket.length - 1] -
              frameCommitTimingBucket[0];
    const numFrame =
        frameCommitTimingBucket.length <= 1
            ? frameCommitTimingBucket.length
            : frameCommitTimingBucket.length - 1;

    return Math.round(numFrame / (duration / 1000));
}

export function DebugSection() {
    const app = useApp();
    const mode = useCell(app.mode);
    const viewport = useCell(app.viewport);
    const forceUpdate = useReducer((x) => x + 1, 0)[1];

    useEffect(() => {
        const timerId = setInterval(() => {
            forceUpdate();
        }, 1000);

        return () => {
            clearInterval(timerId);
        };
    }, [forceUpdate]);

    return (
        <PropertyPane.Section>
            <PropertyPane.Header>Debug</PropertyPane.Header>
            <div>
                <dl>
                    <dt>Version</dt>
                    <dd>
                        <SelectableText>{__COMMIT_HASH__}</SelectableText>
                    </dd>
                    <dt>Viewport</dt>
                    <dd>{`(x:${viewport.rect.left.toFixed(
                        0,
                    )}, y:${viewport.rect.top.toFixed(
                        0,
                    )}, w:${viewport.rect.width.toFixed(
                        0,
                    )}, h:${viewport.rect.height.toFixed(0)}), ${(
                        viewport.scale * 100
                    ).toFixed(0)}%`}</dd>
                    <dt>Mode</dt>
                    <dd>{JSON.stringify(mode)}</dd>
                    <dt>FPS</dt>
                    <dd>{getFPS()}</dd>
                </dl>
            </div>
        </PropertyPane.Section>
    );
}

monitorFPS();
