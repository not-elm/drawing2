import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { type ReactNode, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { AppView } from "./react/AppView";

window.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("root");
    if (container === null) {
        alert("Failed to initialize application");
        return;
    }

    const root = createRoot(container);
    root.render(
        <>
            <EmotionCacheProvider>
                <AppView />
            </EmotionCacheProvider>
        </>,
    );
});

function EmotionCacheProvider({
    children,
}: {
    children?: ReactNode;
}) {
    const emotionCache = useMemo(() => {
        const cache = createCache({ key: "emotion" });
        // This disables :first-child not working in SSR warnings
        // Source: https://github.com/emotion-js/emotion/issues/1105#issuecomment-557726922
        cache.compat = true;
        return cache;
    }, []);

    return <CacheProvider value={emotionCache}>{children}</CacheProvider>;
}
