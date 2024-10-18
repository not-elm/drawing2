export function assert(condition: boolean, message: string): asserts condition {
    if (!condition) {
        throw new Error(message);
    }
}

export class Point {
    constructor(
        public x: number,
        public y: number,
    ) {}
}

export abstract class Node extends Point {
    abstract readonly id: string;
}

export class GraphNode extends Node {
    constructor(
        public readonly id: string,
        x: number,
        y: number,
    ) {
        super(x, y);
    }
}

export class CrossPoint extends Node {
    constructor(
        public readonly p00: string,
        public readonly p01: string,
        public readonly p10: string,
        public readonly p11: string,
        x: number,
        y: number,
    ) {
        super(x, y);
    }

    get id(): string {
        return `${this.p00}-${this.p01}-${this.p10}-${this.p11}`;
    }
}

export class Graph {
    private readonly arguments = new Map<string, Map<string, number>>();
    private normalized = false;

    constructor(
        public readonly nodes: Map<string, Node>,
        public readonly edges: Map<string, string[]>,
    ) {}

    static create(): Graph {
        return new Graph(new Map(), new Map());
    }

    clone(): Graph {
        const nodes = new Map<string, Node>();
        const edges = new Map<string, string[]>();
        for (const [id, node] of this.nodes) {
            nodes.set(id, node);
        }
        for (const [id, edge] of this.edges) {
            edges.set(id, [...edge]);
        }
        return new Graph(nodes, edges);
    }

    addEdge(node1: Node, node2: Node): this {
        if (this.edges.get(node1.id)?.includes(node2.id)) return this;

        this.nodes.set(node1.id, node1);
        this.nodes.set(node2.id, node2);

        this.edges.set(node1.id, [
            ...(this.edges.get(node1.id) ?? []),
            node2.id,
        ]);
        this.edges.set(node2.id, [
            ...(this.edges.get(node2.id) ?? []),
            node1.id,
        ]);

        this.normalized = false;
        return this;
    }

    deleteEdge(nodeId1: string, nodeId2: string): this {
        const newEdges1 = (this.edges.get(nodeId1) ?? []).filter(
            (id) => id !== nodeId2,
        );
        if (newEdges1.length === 0) {
            this.nodes.delete(nodeId1);
            this.edges.delete(nodeId1);
        } else {
            this.edges.set(nodeId1, newEdges1);
        }

        const newEdges2 = (this.edges.get(nodeId2) ?? []).filter(
            (id) => id !== nodeId1,
        );
        if (newEdges2.length === 0) {
            this.nodes.delete(nodeId2);
            this.edges.delete(nodeId2);
        } else {
            this.edges.set(nodeId2, newEdges2);
        }

        this.normalized = false;
        return this;
    }

    addNode(node: Node): this {
        this.nodes.set(node.id, node);

        this.normalized = false;
        return this;
    }

    deleteNode(nodeId: string): this {
        this.nodes.delete(nodeId);
        const nextNodeIds = this.edges.get(nodeId);
        for (const nextNodeId of nextNodeIds ?? []) {
            const newEdges = (this.edges.get(nextNodeId) ?? []).filter(
                (id) => id !== nodeId,
            );
            if (newEdges.length === 0) {
                this.nodes.delete(nextNodeId);
                this.edges.delete(nextNodeId);
            } else {
                this.edges.set(nextNodeId, newEdges);
            }
        }
        this.edges.delete(nodeId);

        this.normalized = false;
        return this;
    }

    setNodePosition(nodeId: string, x: number, y: number): this {
        const node = this.nodes.get(nodeId);
        assert(node !== undefined, `Node ${nodeId} is not found.`);

        node.x = x;
        node.y = y;

        this.normalized = false;
        return this;
    }

    /**
     * Return the argument (偏角) from X-axis to the line segment.
     */
    getArgument(p0Id: string, p1Id: string): number {
        assert(p0Id !== p1Id, `from and to should be different: ${p0Id}`);
        if (p0Id > p1Id) {
            return normalizeRadian(this.getArgument(p1Id, p0Id) + Math.PI);
        }

        let value = this.arguments.get(p0Id)?.get(p1Id);
        if (value === undefined) {
            const p0 = this.nodes.get(p0Id);
            assert(p0 !== undefined, `Node ${p0Id} is not found.`);

            const p1 = this.nodes.get(p1Id);
            assert(p1 !== undefined, `Node ${p1Id} is not found.`);

            value = normalizeRadian(Math.atan2(p1.y - p0.y, p1.x - p0.x));
            if (!this.arguments.has(p0Id)) {
                this.arguments.set(p0Id, new Map());
            }
            this.arguments.get(p0Id)?.set(p1Id, value);
        }

        return value;
    }

    getOutline(): Node[] {
        if (!this.normalized) {
            return this.normalize().getOutline();
        }

        if (this.nodes.size < 3) return [];

        const startNode = [...this.nodes.values()].reduce((n1, n2) =>
            n1.y < n2.y ? n1 : n2,
        );
        let lastNode = startNode;
        const nodes: Node[] = [startNode];

        while (true) {
            const node = this.getNodeBySmallestAngle(
                lastNode.id,
                nodes.length < 2
                    ? 0
                    : this.getArgument(
                          nodes[nodes.length - 1].id,
                          nodes[nodes.length - 2].id,
                      ),
            );
            if (node === startNode) break;

            nodes.push(node);
            lastNode = node;
        }

        return canonicalizeFace(nodes);
    }

    getFaces(): Node[][] {
        if (!this.normalized) {
            return this.normalize().getFaces();
        }

        const faces: Node[][] = [];
        const edgeVisitCount = new Map<string, number>();
        if (this.nodes.size < 3) return faces;

        const node1 = this.nodes.values().next().value;
        assert(node1 !== undefined, "Empty graph");

        const node2Id = this.edges.get(node1.id)?.[0];
        assert(node2Id !== undefined, `Node ${node2Id} is not found.`);
        const node2 = this.nodes.get(node2Id);
        assert(node2 !== undefined, `Node ${node2Id} is not found.`);

        const stack: [Node, Node][] = [[node1, node2]];

        while (stack.length > 0) {
            const edge = stack.pop();
            assert(edge !== undefined, "Empty stack");
            const [node1, node2] = edge;
            if (edgeVisitCount.get(getEdgeId(node1.id, node2.id)) === 2) {
                continue;
            }

            const faceNodes: Node[] = [node1, node2];

            while (true) {
                const nextNode = this.getNodeBySmallestAngle(
                    faceNodes[faceNodes.length - 1].id,
                    this.getArgument(
                        faceNodes[faceNodes.length - 1].id,
                        faceNodes[faceNodes.length - 2].id,
                    ),
                );
                if (nextNode.id === faceNodes[0].id) break;

                faceNodes.push(nextNode);
            }

            if (faceNodes.length < 3) continue;

            faces.push(canonicalizeFace(faceNodes));
            for (let i = 0; i < faceNodes.length; i++) {
                const node1 = faceNodes[i];
                const node2 =
                    i === faceNodes.length - 1
                        ? faceNodes[0]
                        : faceNodes[i + 1];
                const edgeId = getEdgeId(node1.id, node2.id);
                const visitCount = (edgeVisitCount.get(edgeId) ?? 0) + 1;
                edgeVisitCount.set(edgeId, visitCount);

                if (visitCount < 2) {
                    stack.push([node2, node1]);
                }
            }
        }

        return faces;
    }

    getNodeBySmallestAngle(nodeId: string, startAngle: number): Node {
        const nextNodeIds = this.edges.get(nodeId);
        assert(nextNodeIds !== undefined, `Node ${nodeId} is not found.`);

        let bestAngle = normalizeRadian(
            this.getArgument(nodeId, nextNodeIds[0]) - startAngle,
        );
        if (bestAngle === 0) {
            bestAngle = 2 * Math.PI;
        }
        let bestNode = this.nodes.get(nextNodeIds[0]);
        assert(bestNode !== undefined, `Node ${nextNodeIds[0]} is not found.`);
        for (const nextNodeId of nextNodeIds.slice(1)) {
            const nextNode = this.nodes.get(nextNodeId);
            assert(nextNode !== undefined, `Node ${nextNodeId} is not found.`);

            let angle = normalizeRadian(
                this.getArgument(nodeId, nextNode.id) - startAngle,
            );
            if (angle === 0) {
                angle = 2 * Math.PI;
            }

            if (angle < bestAngle) {
                bestNode = nextNode;
                bestAngle = angle;
            }
        }

        return bestNode;
    }

    normalize(): Graph {
        if (this.normalized) return this;
        const clone = this.clone();

        let flagDirty = true;
        while (flagDirty) {
            flagDirty = false;
            const edges = clone.getEdges();

            for (const edge1 of edges) {
                if (flagDirty) break;

                for (const edge2 of edges) {
                    if (flagDirty) break;

                    if (edge1 === edge2) continue;
                    if (edge1[0] === edge2[0]) continue;
                    if (edge1[0] === edge2[1]) continue;
                    if (edge1[1] === edge2[0]) continue;
                    if (edge1[1] === edge2[1]) continue;

                    if (isCross(edge1[0], edge1[1], edge2[0], edge2[1])) {
                        const crossPoint = getCrossPoint(
                            edge1[0],
                            edge1[1],
                            edge2[0],
                            edge2[1],
                        );
                        // Add new edges first. When nodes have only this edge,
                        // they would be cleaned up.
                        clone.addEdge(crossPoint, edge1[0]);
                        clone.addEdge(crossPoint, edge1[1]);
                        clone.addEdge(crossPoint, edge2[0]);
                        clone.addEdge(crossPoint, edge2[1]);
                        clone.deleteEdge(edge1[0].id, edge1[1].id);
                        clone.deleteEdge(edge2[0].id, edge2[1].id);
                        flagDirty = true;
                        break;
                    }
                }
            }
        }

        const nodeIdsToBeDeleted = new Set<string>();
        flagDirty = true;
        while (flagDirty) {
            flagDirty = false;

            for (const node of clone.nodes.values()) {
                if (nodeIdsToBeDeleted.has(node.id)) continue;

                const nextNodeIds = clone.edges
                    .get(node.id)
                    ?.filter(
                        (nextNodeId) => !nodeIdsToBeDeleted.has(nextNodeId),
                    );
                if (nextNodeIds === undefined || nextNodeIds.length <= 1) {
                    nodeIdsToBeDeleted.add(node.id);
                    flagDirty = true;
                }
            }
        }

        for (const nodeId of nodeIdsToBeDeleted) {
            clone.deleteNode(nodeId);
        }

        clone.normalized = true;
        return clone;
    }

    getEdges(): [Node, Node][] {
        const edges: [Node, Node][] = [];
        for (const [from, tos] of this.edges.entries()) {
            const fromNode = this.nodes.get(from);
            assert(fromNode !== undefined, `Node ${from} is not found.`);
            for (const to of tos) {
                if (from > to) continue;

                const toNode = this.nodes.get(to);
                assert(toNode !== undefined, `Node ${to} is not found.`);

                edges.push([fromNode, toNode]);
            }
        }
        return edges;
    }
}

/**
 * Check if two line segments cross each other.
 * @param p00 The start point of the first line segment.
 * @param p01 The end point of the first line segment.
 * @param p10 The start point of the second line segment.
 * @param p11 The end point of the second line segment.
 */
function isCross(p00: Point, p01: Point, p10: Point, p11: Point): boolean {
    const dx0001 = p01.x - p00.x;
    const dy0001 = p01.y - p00.y;

    const dx1011 = p11.x - p10.x;
    const dy1011 = p11.y - p10.y;

    const dx0010 = p10.x - p00.x;
    const dy0010 = p10.y - p00.y;

    const dx0011 = p11.x - p00.x;
    const dy0011 = p11.y - p00.y;

    const dx1000 = p00.x - p10.x;
    const dy1000 = p00.y - p10.y;

    const dx1001 = p01.x - p10.x;
    const dy1001 = p01.y - p10.y;

    const cross00010010 = dx0001 * dy0010 - dy0001 * dx0010;
    const cross00010011 = dx0001 * dy0011 - dy0001 * dx0011;
    const cross10111000 = dx1011 * dy1000 - dy1011 * dx1000;
    const cross10111001 = dx1011 * dy1001 - dy1011 * dx1001;

    return (
        cross00010010 * cross00010011 < 0 && cross10111000 * cross10111001 < 0
    );
}

function getCrossPoint(p00: Node, p01: Node, p10: Node, p11: Node): Node {
    const dx1011 = p11.x - p10.x;
    const dy1011 = p11.y - p10.y;

    const dx1000 = p00.x - p10.x;
    const dy1000 = p00.y - p10.y;
    const cross_v1000_v1011 = Math.abs(dx1000 * dy1011 - dy1000 * dx1011);

    const dx1001 = p01.x - p10.x;
    const dy1001 = p01.y - p10.y;
    const cross_v1001_v1011 = Math.abs(dx1001 * dy1011 - dy1001 * dx1011);

    const x =
        p10.x +
        (cross_v1001_v1011 * dx1000 + cross_v1000_v1011 * dx1001) /
            (cross_v1000_v1011 + cross_v1001_v1011);
    const y =
        p10.y +
        (cross_v1001_v1011 * dy1000 + cross_v1000_v1011 * dy1001) /
            (cross_v1000_v1011 + cross_v1001_v1011);

    return new CrossPoint(p00.id, p01.id, p10.id, p11.id, x, y);
}

function normalizeRadian(v: number): number {
    return v - Math.floor(v / (2 * Math.PI)) * 2 * Math.PI;
}

export function getEdgeId(p0: string, p1: string): string {
    return p0 < p1 ? `${p0}-${p1}` : `${p1}-${p0}`;
}

function canonicalizeFace(face: Node[]): Node[] {
    const startNode = face.reduce((n1, n2) => (n1.y < n2.y ? n1 : n2));
    const startIndex = face.indexOf(startNode);
    return [...face.slice(startIndex), ...face.slice(0, startIndex)];
}

export function isSameFace(face1: Node[], face2: Node[]) {
    return (
        face1.length === face2.length &&
        face1.every((node, i) => node.id === face2[i].id)
    );
}
