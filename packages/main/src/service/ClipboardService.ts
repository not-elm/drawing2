// export const ClipboardService = new (class {
//     copy(objects: Block[]): Promise<void> {
//         const json = JSON.stringify({ objects });
//         return navigator.clipboard.writeText(json);
//     }
//
//     async paste(): Promise<{
//         objects: Block[];
//     }> {
//         try {
//             const json = await navigator.clipboard.readText();
//             const { objects } = JSON.parse(json) as { objects: Object[] };
//
//             console.error("TODO: paste");
//             throw new Error("TODO: paste");
//             // (old point id) => (new point)
//             // const points = new Map<string, PointObject>();
//             // function getOrCreatePoint(oldId: string, x: number, y: number): string {
//             // 	let newPoint = points.get(oldId);
//             // 	if (newPoint === undefined) {
//             // 		newPoint = createPointObject(x, y);
//             // 		points.set(oldId, newPoint);
//             // 	}
//             // 	return newPoint.id;
//             // }
//             //
//             // for (const obj of objects) {
//             // 	obj.id = randomId();
//             //
//             // 	if (obj.type === "line") {
//             // 		obj.p1Id = getOrCreatePoint(obj.p1Id, obj.x1, obj.y1);
//             // 		obj.p2Id = getOrCreatePoint(obj.p2Id, obj.x2, obj.y2);
//             // 	}
//             // }
//             // return {
//             // 	objects,
//             // 	points: Array.from(points.values()),
//             // };
//         } catch {
//             return {
//                 objects: [],
//             };
//         }
//     }
// })();
