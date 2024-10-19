import { randomId } from "main/src/lib/randomId";
import { Fragment, useEffect, useState } from "react";
import { FPSMeter } from "./FPSMeter";
import {
    assert,
    CrossPoint,
    Graph,
    GraphNode,
    getEdgeId,
    isSameFace,
} from "./Graph";

export const RANDOM_NODE_COUNT = 30;

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
    const [mousePoint, setMousePoint] = useState({ x: 0, y: 0 });
    const [{ graph }, setGraph] = useState(() => ({ graph: Graph.create() }));
    const [outlineOnly, setOutlineOnly] = useState(false);
    const normalized = graph.normalize();

    useEffect(() => {
        function handlePointerMove(ev: PointerEvent) {
            setMousePoint({ x: ev.clientX, y: ev.clientY });
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
    const hovered = graph.contains(mousePoint);

    return (
        <div
            css={{ position: "fixed", inset: 0 }}
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
                {outlineOnly ? (
                    <g aria-label="outline">
                        <path
                            d={`M${graph
                                .getOutline()
                                .map((node) => `${node.x},${node.y}`)
                                .join(" L")} Z`}
                            fill={hovered ? "#f0f0f0" : "#a0a0a0"}
                            stroke="#000"
                            // strokeWidth={5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </g>
                ) : (
                    <>
                        <g aria-label="faces">
                            {[...graph.getFaces()]
                                .filter((nodes) => !isSameFace(outline, nodes))
                                .map((nodes, i) => {
                                    return (
                                        <path
                                            key={`area-${i}`}
                                            d={`M${nodes
                                                .map(
                                                    (node) =>
                                                        `${node.x},${node.y}`,
                                                )
                                                .join(" L")} Z`}
                                            fill={`rgb(${
                                                (83 * (i + 1)) % 255
                                            },${(113 * (i + 1)) % 255},${
                                                (37 * (i + 1)) % 255
                                            })`}
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
                                                    graph.addEdge(
                                                        fromNode,
                                                        node,
                                                    );
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
                        <g aria-label="edge">
                            <path
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

                                                const toNode =
                                                    graph.nodes.get(to);
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
                        </g>
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
                            ))}
                        </g>
                        <g aria-label="nodes">
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
                                                    mode.type ===
                                                        "node-selected" &&
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
                                                        setMode({
                                                            type: "none",
                                                        });
                                                        ev.stopPropagation();
                                                        break;
                                                    } else {
                                                        setGraph(
                                                            ({ graph }) => {
                                                                graph.addEdge(
                                                                    mode.node,
                                                                    node,
                                                                );
                                                                return {
                                                                    graph,
                                                                };
                                                            },
                                                        );
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
                    </>
                )}
            </svg>

            <div
                css={{
                    position: "fixed",
                    top: 16,
                    left: 16,
                    paddingTop: 32,
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    gap: 8,
                }}
            >
                <button
                    type="button"
                    onPointerDown={(ev) => {
                        ev.stopPropagation();
                    }}
                    onClick={(ev) => {
                        ev.preventDefault();
                        ev.stopPropagation();

                        const width = window.innerWidth;
                        const height = window.innerHeight;

                        const nodes: GraphNode[] = [];
                        for (let i = 0; i < RANDOM_NODE_COUNT; i++) {
                            const x = Math.random() * width;
                            const y = Math.random() * height;
                            nodes.push(new GraphNode(randomId(), x, y));
                        }

                        setGraph(({ graph }) => {
                            for (let i = 0; i < nodes.length - 1; i++) {
                                graph.addEdge(nodes[i], nodes[i + 1]);
                            }
                            graph.addEdge(nodes[nodes.length - 1], nodes[0]);

                            return { graph };
                        });
                    }}
                >
                    Random
                </button>
                <label
                    onPointerDown={(ev) => {
                        ev.stopPropagation();
                    }}
                >
                    <input
                        type="checkbox"
                        checked={outlineOnly}
                        onChange={(ev) => setOutlineOnly(ev.target.checked)}
                    />
                    <span>アウトラインのみ表示</span>
                </label>
            </div>
            <FPSMeter />
        </div>
    );
}
