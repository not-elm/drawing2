import { assert } from "../lib/assert";
import type { Dependency } from "./Dependency";

export class DependencyCollection {
    private readonly dependencyById = new Map<string, Dependency>();
    private readonly dependencyIdsByFromObjectId = new Map<
        string,
        Set<string>
    >();
    private readonly dependencyIdsByToObjectId = new Map<string, Set<string>>();

    add(dependency: Dependency) {
        if (this.isReachable(dependency.to, dependency.from)) {
            throw new Error(
                `Dependency cycle detected: ${dependency.from} -> ${dependency.to}`,
            );
        }

        this.dependencyById.set(dependency.id, dependency);

        const fromIds = this.dependencyIdsByFromObjectId.get(dependency.from);
        if (fromIds === undefined) {
            this.dependencyIdsByFromObjectId.set(
                dependency.from,
                new Set([dependency.id]),
            );
        } else {
            fromIds.add(dependency.id);
        }

        const toIds = this.dependencyIdsByToObjectId.get(dependency.to);
        if (toIds === undefined) {
            this.dependencyIdsByToObjectId.set(
                dependency.to,
                new Set([dependency.id]),
            );
        } else {
            toIds.add(dependency.id);
        }
    }

    getByFromObjectId(objectId: string): Dependency[] {
        const dependencyIds = this.dependencyIdsByFromObjectId.get(objectId);
        if (dependencyIds === undefined) return [];

        return Array.from(dependencyIds).map((id) => {
            const dependency = this.dependencyById.get(id);
            assert(dependency !== undefined, `Dependency not found: ${id}`);
            return dependency;
        });
    }

    getByToObjectId(objectId: string): Dependency[] {
        const dependencyIds = this.dependencyIdsByToObjectId.get(objectId);
        if (dependencyIds === undefined) return [];

        return Array.from(dependencyIds).map((id) => {
            const dependency = this.dependencyById.get(id);
            assert(dependency !== undefined, `Dependency not found: ${id}`);
            return dependency;
        });
    }

    deleteById(id: string) {
        const dependency = this.dependencyById.get(id);
        assert(dependency !== undefined, `Dependency not found: ${id}`);

        this.dependencyById.delete(id);

        const idsForFromObject = this.dependencyIdsByFromObjectId.get(
            dependency.from,
        );
        assert(
            idsForFromObject !== undefined,
            `Object not found in dependency collection: ${id}`,
        );
        idsForFromObject.delete(id);
        if (idsForFromObject.size === 0) {
            this.dependencyIdsByFromObjectId.delete(dependency.from);
        }

        const idsForToObject = this.dependencyIdsByToObjectId.get(
            dependency.to,
        );
        assert(
            idsForToObject !== undefined,
            `Object not found in dependency collection: ${id}`,
        );
        idsForToObject.delete(id);
        if (idsForToObject.size === 0) {
            this.dependencyIdsByToObjectId.delete(dependency.to);
        }
    }

    deleteByObjectId(objectId: string) {
        const ids = [
            ...(this.dependencyIdsByFromObjectId.get(objectId) ?? []),
            ...(this.dependencyIdsByToObjectId.get(objectId) ?? []),
        ];

        for (const id of ids) {
            this.deleteById(id);
        }
    }

    /**
     * Collects all dependencies of the given objects and descendants.
     * The returned dependencies are ordered such that if A depends on B, then B comes before A.
     * @param sourceObjectIds
     */
    collectDependencies(sourceObjectIds: string[]): Dependency[] {
        const objectIds: string[] = [];
        const visited = new Set<string>();

        const visit = (objectId: string) => {
            if (visited.has(objectId)) return;
            visited.add(objectId);

            const outGoingDependencyIds =
                this.dependencyIdsByFromObjectId.get(objectId) ?? [];
            for (const dependencyId of outGoingDependencyIds) {
                visit(this.dependencyById.get(dependencyId)?.to ?? "");
            }
            objectIds.unshift(objectId);
        };

        for (const objectId of sourceObjectIds) {
            visit(objectId);
        }

        const dependencies: Dependency[] = [];
        for (const objectId of objectIds) {
            const dependencyIds =
                this.dependencyIdsByFromObjectId.get(objectId);
            if (dependencyIds === undefined) continue;

            for (const dependencyId of dependencyIds) {
                const dependency = this.dependencyById.get(dependencyId);
                assert(
                    dependency !== undefined,
                    `Dependency not found: ${dependencyId}`,
                );
                dependencies.push(dependency);
            }
        }

        return dependencies;
    }

    private isReachable(from: string, to: string): boolean {
        const visited = new Set<string>();
        const stack = [from];
        while (stack.length > 0) {
            const current = stack.pop();
            assert(current !== undefined);

            if (visited.has(current)) continue;
            visited.add(current);

            const dependencyIds = this.dependencyIdsByFromObjectId.get(current);
            if (dependencyIds === undefined) continue;

            for (const dependencyId of dependencyIds) {
                const dependency = this.dependencyById.get(dependencyId);
                assert(
                    dependency !== undefined,
                    `Dependency not found: ${dependencyId}`,
                );
                if (dependency.to === to) return true;

                stack.push(dependency.to);
            }
        }
        return false;
    }
}
