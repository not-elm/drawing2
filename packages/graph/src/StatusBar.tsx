import { useEffect, useRef } from "react";

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

export function StatusBar() {
    const domRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        const timerId = setInterval(() => {
            const dom = domRef.current;
            if (dom === null) return;

            const duration =
                frameCommitTimingBucket.length <= 1
                    ? SIZE
                    : frameCommitTimingBucket[
                          frameCommitTimingBucket.length - 1
                      ] - frameCommitTimingBucket[0];
            const numFrame =
                frameCommitTimingBucket.length <= 1
                    ? frameCommitTimingBucket.length
                    : frameCommitTimingBucket.length - 1;

            const fps = Math.round(numFrame / (duration / 1000));

            dom.innerText = [`FPS: ${fps}`].join("\n");
        }, 200);

        return () => {
            clearInterval(timerId);
        };
    }, []);

    useEffect(() => {
        const dom = document.createElement("div");
        dom.style.pointerEvents = "none";
        dom.style.position = "fixed";
        dom.style.bottom = "10px";
        dom.style.left = "10px";
        dom.style.fontFamily = "monospace";
        dom.style.color = "#505263";
        dom.style.whiteSpace = "pre";

        document.body.appendChild(dom);
        domRef.current = dom;

        return () => {
            dom.remove();
        };
    }, []);

    return <></>;
}

monitorFPS();
