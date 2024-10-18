import { describe, it } from "bun:test";
import { Graph, GraphNode } from "./Graph";

describe("Graph", () => {
    // it("getArea1", () => {
    //     const n1 = new GraphNode("n1", 0, 0);
    //     const n2 = new GraphNode("n2", 2, 0);
    //     const n3 = new GraphNode("n3", 2, 2);
    //     const n4 = new GraphNode("n4", 0, 2);
    //     const n5 = new GraphNode("n5", 1, 1);
    //
    //     const graph = new Graph(
    //         new Map([
    //             [n1.id, n1],
    //             [n2.id, n2],
    //             [n3.id, n3],
    //             [n4.id, n4],
    //             [n5.id, n5],
    //         ]),
    //         new Map([
    //             [n1.id, [n2.id, n4.id]],
    //             [n2.id, [n1.id, n3.id, n5.id]],
    //             [n3.id, [n2.id, n4.id]],
    //             [n4.id, [n1.id, n3.id, n5.id]],
    //             [n5.id, [n2.id, n4.id]],
    //         ]),
    //     );
    //
    //     console.log(
    //         graph
    //             .getAreas()
    //             .map((nodes) => nodes.map((node) => node.id).join(",")),
    //     );
    //     console.log(
    //         graph
    //             .getOutline()
    //             .map((node) => `(${node.x},${node.y})`)
    //             .join(","),
    //     );
    // });
    //
    // it("getArea2", () => {
    //     const n1 = new GraphNode("n1", 0, 0);
    //     const n2 = new GraphNode("n2", 3, 0);
    //     const n3 = new GraphNode("n3", 3, 3);
    //     const n4 = new GraphNode("n4", 0, 3);
    //     const n5 = new GraphNode("n5", 1, 1);
    //     const n6 = new GraphNode("n6", 2, 1);
    //     const n7 = new GraphNode("n7", 2, 2);
    //     const n8 = new GraphNode("n8", 1, 2);
    //
    //     const graph = Graph.create();
    //     graph
    //         .addEdge(n1, n2)
    //         .addEdge(n4, n1)
    //         .addEdge(n5, n6)
    //         .addEdge(n6, n7)
    //         .addEdge(n7, n8)
    //         .addEdge(n8, n5)
    //         .addEdge(n1, n5)
    //         .addEdge(n2, n6)
    //         .addEdge(n3, n7)
    //         .addEdge(n4, n8);
    //
    //     console.log(
    //         graph
    //             .getAreas()
    //             .map((nodes) => nodes.map((node) => node.id).join(",")),
    //     );
    //     console.log(
    //         graph
    //             .getOutline()
    //             .map((node) => `(${node.x},${node.y})`)
    //             .join(","),
    //     );
    // });

    it("getArea3", () => {
        const n1 = new GraphNode("n1", 0, 0);
        const n2 = new GraphNode("n2", 1, 1);
        const n3 = new GraphNode("n3", 0, 1);
        const n4 = new GraphNode("n4", 1, 0);

        const graph = Graph.create();
        graph.addEdge(n1, n2).addEdge(n2, n3).addEdge(n3, n4).addEdge(n4, n1);

        console.log(
            graph
                .getFaces()
                .map((nodes) => nodes.map((node) => node.id).join(",")),
        );
        console.log(
            graph
                .getOutline()
                .map((node) => `(${node.x},${node.y})`)
                .join(","),
        );
    });
});
