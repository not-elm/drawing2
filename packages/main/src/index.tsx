import { MathJaxContext } from "better-react-mathjax";
import { createRoot } from "react-dom/client";
import { App } from "./react/App";
import { ControllerProvider } from "./react/ControllerProvider";

window.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("root");
    if (container === null) {
        alert("Failed to initialize application");
        return;
    }

    const root = createRoot(container);
    root.render(
        <MathJaxContext
            version={2}
            config={{
                // https://docs.mathjax.org/en/stable/start.html#configuring-your-copy-of-mathjax
                tex2jax: {
                    inlineMath: [
                        ["$", "$"],
                        ["\\(", "\\)"],
                    ],
                },
            }}
        >
            <ControllerProvider>
                <App />
            </ControllerProvider>
        </MathJaxContext>,
    );
});
