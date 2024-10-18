import { randomId } from "main/src/lib/randomId";
import { Fragment, useEffect, useState } from "react";
import {
    assert,
    CrossPoint,
    Graph,
    GraphNode,
    getEdgeId,
    isSameFace,
} from "./Graph";
import { StatusBar } from "./StatusBar";

export function App() {
    const [mode, setMode] = useState<
        | {
              type: "none";
          }
        | {
              type: "node-dragging";
              nodeId: string;
          }
        | {
              type: "node-selected";
              node: GraphNode;
          }
    >({ type: "none" });
    const [{ graph }, setGraph] = useState(() => ({ graph: Graph.create() }));
    const normalized = graph.normalize();

    useEffect(() => {
        function handlePointerMove(ev: PointerEvent) {
            if (mode.type === "node-dragging") {
                setGraph(({ graph }) => {
                    graph.setNodePosition(mode.nodeId, ev.clientX, ev.clientY);
                    return { graph };
                });
            }
        }
        function handlePointerUp(ev: PointerEvent) {
            if (mode.type === "node-dragging") {
                const node = graph.nodes.get(mode.nodeId);
                assert(node !== undefined, `Node ${mode.nodeId} is not found.`);

                setMode({ type: "node-selected", node });
            }
        }

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);

        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
        };
    }, [graph, mode]);

    const outline = graph.getOutline();

    return (
        <div
            css={{ position: "fixed", inset: 8 }}
            onPointerDown={(ev) => {
                const newNode = new GraphNode(
                    randomId(),
                    ev.clientX,
                    ev.clientY,
                );
                setGraph(({ graph }) => {
                    graph.addNode(newNode);
                    return { graph };
                });
                switch (mode.type) {
                    case "none":
                        setMode({ type: "node-selected", node: newNode });
                        break;
                    case "node-selected":
                        setGraph(({ graph }) => {
                            graph.addEdge(mode.node, newNode);
                            return { graph };
                        });
                        setMode({ type: "node-selected", node: newNode });
                        break;
                }
            }}
        >
            <svg
                viewBox="0 0 1 1"
                css={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: 1,
                    height: 1,
                    overflow: "visible",
                }}
            >
                <g aria-label="faces">
                    {[...graph.getFaces()]
                        .filter((nodes) => !isSameFace(outline, nodes))
                        .map((nodes, i) => {
                            return (
                                <path
                                    key={`area-${i}`}
                                    d={`M${nodes
                                        .map((node) => `${node.x},${node.y}`)
                                        .join(" L")} Z`}
                                    fill={`rgb(${(83 * (i + 1)) % 255},${
                                        (113 * (i + 1)) % 255
                                    },${(37 * (i + 1)) % 255})`}
                                />
                            );
                        })}
                </g>
                <g aria-label="edge-hit-area">
                    {[...graph.edges.entries()].map(([from, tos]) => {
                        const fromNode = graph.nodes.get(from);
                        assert(
                            fromNode !== undefined,
                            `Node ${from} is not found.`,
                        );

                        return [...tos].map((to) => {
                            if (from < to) return null;

                            const toNode = graph.nodes.get(to);
                            assert(
                                toNode !== undefined,
                                `Node ${to} is not found.`,
                            );

                            return (
                                <path
                                    key={getEdgeId(from, to)}
                                    css={{
                                        stroke: "transparent",
                                        opacity: 0.3,
                                        "&:hover": {
                                            stroke: "#4d90fe",
                                        },
                                    }}
                                    d={`M${fromNode.x},${fromNode.y} L${toNode.x},${toNode.y}`}
                                    strokeWidth={10}
                                    onPointerDown={(ev) => {
                                        const node = new GraphNode(
                                            randomId(),
                                            ev.clientX,
                                            ev.clientY,
                                        );
                                        setGraph(({ graph }) => {
                                            graph.deleteEdge(from, to);
                                            graph.addEdge(fromNode, node);
                                            graph.addEdge(node, toNode);
                                            return { graph };
                                        });
                                        setMode({
                                            type: "node-dragging",
                                            nodeId: node.id,
                                        });
                                        ev.stopPropagation();
                                    }}
                                    onContextMenu={(ev) => {
                                        setGraph(({ graph }) => {
                                            graph.deleteEdge(from, to);
                                            return { graph };
                                        });
                                        setMode({ type: "none" });
                                        ev.stopPropagation();
                                    }}
                                />
                            );
                        });
                    })}
                </g>
                <path
                    aria-label="edge"
                    pointerEvents="none"
                    d={[...graph.edges.entries()]
                        .map(([from, tos]) => {
                            const fromNode = graph.nodes.get(from);
                            assert(
                                fromNode !== undefined,
                                `Node ${from} is not found.`,
                            );

                            return [...tos]
                                .map((to) => {
                                    if (from < to) return null;

                                    const toNode = graph.nodes.get(to);
                                    assert(
                                        toNode !== undefined,
                                        `Node ${to} is not found.`,
                                    );

                                    return `M${fromNode.x},${fromNode.y} L${toNode.x},${toNode.y}`;
                                })
                                .join(" ");
                        })
                        .join(" ")}
                    stroke="#000"
                    strokeWidth={5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <g aria-label="node-hit-area">
                    {[...graph.nodes.values()].map((node) => (
                        <circle
                            key={node.id}
                            cx={node.x}
                            cy={node.y}
                            r={20}
                            fill="#4d90fe"
                            css={{
                                opacity:
                                    mode.type === "node-selected" &&
                                    mode.node.id === node.id
                                        ? 0.3
                                        : 0,
                                cursor: "pointer",
                                "&:hover": {
                                    opacity:
                                        mode.type === "node-selected" &&
                                        mode.node.id === node.id
                                            ? 0.3
                                            : 0.1,
                                },
                            }}
                            onContextMenu={(ev) => {
                                setGraph(({ graph }) => {
                                    graph.deleteNode(node.id);
                                    return { graph };
                                });
                                setMode({ type: "none" });
                                ev.stopPropagation();
                                ev.preventDefault();
                                return;
                            }}
                            onPointerDown={(ev) => {
                                if (ev.button === 2) {
                                    ev.stopPropagation();
                                    return;
                                }
                                switch (mode.type) {
                                    case "none": {
                                        setMode({
                                            type: "node-dragging",
                                            nodeId: node.id,
                                        });
                                        ev.stopPropagation();
                                        break;
                                    }
                                    case "node-selected": {
                                        if (mode.node === node) {
                                            setMode({ type: "none" });
                                            ev.stopPropagation();
                                            break;
                                        } else {
                                            setGraph(({ graph }) => {
                                                graph.addEdge(mode.node, node);
                                                return { graph };
                                            });
                                            setMode({
                                                type: "node-dragging",
                                                nodeId: node.id,
                                            });
                                            ev.stopPropagation();
                                            break;
                                        }
                                    }
                                }
                            }}
                        />
                    ))}
                </g>
                <g aria-label="nodes" css={{ display: "none" }}>
                    {[...normalized.nodes.values()]
                        .filter((node) => node instanceof CrossPoint)
                        .map((node) => (
                            <circle
                                key={node.id}
                                cx={node.x}
                                cy={node.y}
                                pointerEvents="none"
                                r={3}
                                fill="#f00"
                            />
                        ))}
                    {[...graph.nodes.values()].map((node) => (
                        <Fragment key={node.id}>
                            <circle
                                key={node.id}
                                cx={node.x}
                                cy={node.y}
                                r={20}
                                fill="#4d90fe"
                                css={{
                                    opacity:
                                        mode.type === "node-selected" &&
                                        mode.node.id === node.id
                                            ? 0.3
                                            : 0,
                                    cursor: "pointer",
                                    "&:hover": {
                                        opacity:
                                            mode.type === "node-selected" &&
                                            mode.node.id === node.id
                                                ? 0.3
                                                : 0.1,
                                    },
                                }}
                                onContextMenu={(ev) => {
                                    setGraph(({ graph }) => {
                                        graph.deleteNode(node.id);
                                        return { graph };
                                    });
                                    setMode({ type: "none" });
                                    ev.stopPropagation();
                                    ev.preventDefault();
                                    return;
                                }}
                                onPointerDown={(ev) => {
                                    if (ev.button === 2) {
                                        ev.stopPropagation();
                                        return;
                                    }
                                    switch (mode.type) {
                                        case "none": {
                                            setMode({
                                                type: "node-dragging",
                                                nodeId: node.id,
                                            });
                                            ev.stopPropagation();
                                            break;
                                        }
                                        case "node-selected": {
                                            if (mode.node === node) {
                                                setMode({ type: "none" });
                                                ev.stopPropagation();
                                                break;
                                            } else {
                                                setGraph(({ graph }) => {
                                                    graph.addEdge(
                                                        mode.node,
                                                        node,
                                                    );
                                                    return { graph };
                                                });
                                                setMode({
                                                    type: "node-dragging",
                                                    nodeId: node.id,
                                                });
                                                ev.stopPropagation();
                                                break;
                                            }
                                        }
                                    }
                                }}
                            />
                            <circle
                                cx={node.x}
                                cy={node.y}
                                pointerEvents="none"
                                r={5}
                                stroke="#4d90fe"
                                strokeWidth={2}
                                fill="#fff"
                            />
                        </Fragment>
                    ))}
                </g>
            </svg>

            <StatusBar />
        </div>
    );
}

export const Colors = [
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
