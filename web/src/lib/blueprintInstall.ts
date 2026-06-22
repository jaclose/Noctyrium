// Instantiate a per-user InstalledBlueprint from a catalog entry, and reconcile
// an existing install against an updated catalog WITHOUT losing user progress.
import type { BlueprintCatalogEntry } from "./blueprintCatalog";
import { catalogNodeId } from "./blueprintCatalog";
import type { InstalledBlueprint, InstalledBlueprintNode } from "./types";

const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

export function instantiateBlueprint(entry: BlueprintCatalogEntry, titleOverride?: string): InstalledBlueprint {
  const installedAt = now();
  const nodes: InstalledBlueprintNode[] = [];
  let order = 0;
  for (const category of entry.categories) {
    for (const node of category.nodes) {
      const src = node.source ?? entry.source;
      nodes.push({
        id: uid(),
        catalogNodeId: catalogNodeId(entry.id, category.name, node.objective),
        category: category.name,
        subCategory: node.subCategory,
        objective: node.objective,
        detail: node.detail,
        taskType: node.taskType,
        priority: node.priority ?? "medium",
        status: "not-started",
        mastery: 0,
        tags: node.tags ?? [],
        sourceType: src?.type,
        sourceName: src?.name,
        sourceUrl: src?.url,
        lastVerified: src?.lastVerified,
        sourceVerification: src?.verification,
        sourceConfidence: src?.confidence,
        sourceVersion: src?.sourceVersion,
        sourceAuditNote: src?.auditNote,
        sourceChangeLog: src?.changeLog,
        resourceLinks: node.resourceLinks ?? [],
        linkedQuestions: 0,
        linkedAnki: 0,
        linkedErrorLog: 0,
        linkedAssessments: 0,
        estimatedMinutes: node.estimatedMinutes,
        order: order++,
        version: entry.version,
        createdAt: installedAt,
        updatedAt: installedAt,
      });
    }
  }
  return {
    id: uid(),
    blueprintId: entry.id,
    laneId: entry.laneId,
    title: titleOverride ?? entry.title,
    catalogVersion: entry.version,
    installedAt,
    updatedAt: installedAt,
    nodes,
  };
}

/** Clone an existing install (fresh ids) for a user-requested versioned duplicate. */
export function duplicateInstall(install: InstalledBlueprint, title: string): InstalledBlueprint {
  const at = now();
  return {
    ...install,
    id: uid(),
    title,
    installedAt: at,
    updatedAt: at,
    nodes: install.nodes.map((node) => ({ ...node, id: uid() })),
  };
}

/**
 * Merge catalog updates into an existing install: keep user progress (status,
 * mastery, links, evidence, notes) by catalogNodeId, add new catalog nodes,
 * refresh template metadata, and keep any user-only extra nodes.
 */
export function reconcileBlueprint(install: InstalledBlueprint, entry: BlueprintCatalogEntry): InstalledBlueprint {
  const fresh = instantiateBlueprint(entry, install.title);
  const existingByCat = new Map(install.nodes.map((node) => [node.catalogNodeId, node]));
  const merged: InstalledBlueprintNode[] = fresh.nodes.map((freshNode) => {
    const prev = existingByCat.get(freshNode.catalogNodeId);
    if (!prev) return freshNode;
    return {
      ...freshNode,
      id: prev.id,
      status: prev.status,
      mastery: prev.mastery,
      tags: prev.tags.length ? prev.tags : freshNode.tags,
      linkedQuestions: prev.linkedQuestions,
      linkedAnki: prev.linkedAnki,
      linkedErrorLog: prev.linkedErrorLog,
      linkedAssessments: prev.linkedAssessments,
      dueDate: prev.dueDate,
      evidenceOfCompletion: prev.evidenceOfCompletion,
      notes: prev.notes,
      order: prev.order,
      createdAt: prev.createdAt,
      updatedAt: prev.updatedAt,
    };
  });
  const catalogIds = new Set(fresh.nodes.map((node) => node.catalogNodeId));
  const userExtras = install.nodes.filter((node) => !catalogIds.has(node.catalogNodeId));
  return {
    ...install,
    catalogVersion: entry.version,
    updatedAt: now(),
    nodes: [...merged, ...userExtras],
  };
}
