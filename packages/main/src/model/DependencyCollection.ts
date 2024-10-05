import { assert } from "../lib/assert";
import type { Dependency } from "./Dependency";

export class DependencyCollection {
    private readonly dependencyById = new Map<string, Dependency>();
    private readonly dependencyIdsByFromEntityId = new Map<
        string,
        Set<string>
    >();
    private readonly dependencyIdsByToEntityId = new Map<string, Set<string>>();

    add(dependency: Dependency) {
        if (this.isReachable(dependency.to, dependency.from)) {
            throw new Error(
                `Dependency cycle detected: ${dependency.from} -> ${dependency.to}`,
            );
        }

        this.dependencyById.set(dependency.id, dependency);

        const fromIds = this.dependencyIdsByFromEntityId.get(dependency.from);
        if (fromIds === undefined) {
            this.dependencyIdsByFromEntityId.set(
                dependency.from,
                new Set([dependency.id]),
            );
        } else {
            fromIds.add(dependency.id);
        }

        const toIds = this.dependencyIdsByToEntityId.get(dependency.to);
        if (toIds === undefined) {
            this.dependencyIdsByToEntityId.set(
                dependency.to,
                new Set([dependency.id]),
            );
        } else {
            toIds.add(dependency.id);
        }
    }

    getByFromEntityId(entityId: string): Dependency[] {
        const dependencyIds = this.dependencyIdsByFromEntityId.get(entityId);
        if (dependencyIds === undefined) return [];

        return Array.from(dependencyIds).map((id) => {
            const dependency = this.dependencyById.get(id);
            assert(dependency !== undefined, `Dependency not found: ${id}`);
            return dependency;
        });
    }

    getByToEntityId(entityId: string): Dependency[] {
        const dependencyIds = this.dependencyIdsByToEntityId.get(entityId);
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

        const idsForFromEntity = this.dependencyIdsByFromEntityId.get(
            dependency.from,
        );
        assert(
            idsForFromEntity !== undefined,
            `Entity not found in dependency collection: ${id}`,
        );
        idsForFromEntity.delete(id);
        if (idsForFromEntity.size === 0) {
            this.dependencyIdsByFromEntityId.delete(dependency.from);
        }

        const idsForToEntity = this.dependencyIdsByToEntityId.get(
            dependency.to,
        );
        assert(
            idsForToEntity !== undefined,
            `Entity not found in dependency collection: ${id}`,
        );
        idsForToEntity.delete(id);
        if (idsForToEntity.size === 0) {
            this.dependencyIdsByToEntityId.delete(dependency.to);
        }
    }

    deleteByEntityId(entityId: string) {
        const ids = [
            ...(this.dependencyIdsByFromEntityId.get(entityId) ?? []),
            ...(this.dependencyIdsByToEntityId.get(entityId) ?? []),
        ];

        for (const id of ids) {
            this.deleteById(id);
        }
    }

    /**
     * Collects all dependencies of the given entities and descendants.
     * The returned dependencies are ordered such that if A depends on B, then B comes before A.
     * @param sourceEntityIds
     */
    collectDependencies(sourceEntityIds: string[]): Dependency[] {
        const entityIds: string[] = [];
        const visited = new Set<string>();

        const visit = (entityId: string) => {
            if (visited.has(entityId)) return;
            visited.add(entityId);

            const outGoingDependencyIds =
                this.dependencyIdsByFromEntityId.get(entityId) ?? [];
            for (const dependencyId of outGoingDependencyIds) {
                visit(this.dependencyById.get(dependencyId)?.to ?? "");
            }
            entityIds.unshift(entityId);
        };

        for (const entityId of sourceEntityIds) {
            visit(entityId);
        }

        const dependencies: Dependency[] = [];
        for (const entityId of entityIds) {
            const dependencyIds =
                this.dependencyIdsByFromEntityId.get(entityId);
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

            const dependencyIds = this.dependencyIdsByFromEntityId.get(current);
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
