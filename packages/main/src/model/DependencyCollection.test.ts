import { expect, test } from "bun:test";
import type { Dependency } from "./Dependency";
import { DependencyCollection } from "./DependencyCollection";

function dep(from: string, to: string): Dependency {
	return {
		id: `${from}->${to}`,
		type: "pointOnLine",
		from,
		to,
		r: 0.5,
	};
}

const depAtoB = dep("a", "b");
const depAtoC = dep("a", "c");
const depBtoC = dep("b", "c");
const depBtoD = dep("b", "d");
const depCtoD = dep("c", "d");
const depCtoA = dep("c", "a");

test("single dependency", () => {
	const collection = new DependencyCollection();

	collection.add(depAtoB);

	expect(collection.collectDependencies(["a"])).toEqual([depAtoB]);
});

test("single dependency sequence", () => {
	const collection = new DependencyCollection();

	collection.add(depCtoD);
	collection.add(depBtoC);
	collection.add(depAtoB);

	expect(collection.collectDependencies(["a"])).toEqual([
		depAtoB,
		depBtoC,
		depCtoD,
	]);
});

test("branched dependencies", () => {
	const collection = new DependencyCollection();

	collection.add(depCtoD);
	collection.add(depAtoC);
	collection.add(depBtoC);

	expect(collection.collectDependencies(["a"])).toEqual([depAtoC, depCtoD]);
	expect(collection.collectDependencies(["b"])).toEqual([depBtoC, depCtoD]);
	expect(collection.collectDependencies(["a", "b"])).toEqual([
		depBtoC,
		depAtoC,
		depCtoD,
	]);
});

test("diamond dependencies", () => {
	const collection = new DependencyCollection();

	collection.add(depAtoC);
	collection.add(depCtoD);
	collection.add(depBtoD);
	collection.add(depAtoB);

	expect(collection.collectDependencies(["a"])).toEqual([
		depAtoC,
		depAtoB,
		depBtoD,
		depCtoD,
	]);
});

test("circular dependency", () => {
	const collection = new DependencyCollection();

	collection.add(depBtoC);
	collection.add(depAtoB);
	expect(() => collection.add(depCtoA)).toThrowError();
});

test("remove by objectId", () => {
	const collection = new DependencyCollection();

	collection.add(depBtoC);
	collection.add(depAtoB);
	collection.deleteByObjectId("b");

	expect(collection.collectDependencies(["a"])).toEqual([]);
	expect(collection.collectDependencies(["c"])).toEqual([]);
});

test("remove by dependency id", () => {
	const collection = new DependencyCollection();

	collection.add(depBtoD);
	collection.add(depAtoB);
	collection.add(depBtoC);
	collection.deleteById(depBtoD.id);

	expect(collection.collectDependencies(["a"])).toEqual([depAtoB, depBtoC]);
});
