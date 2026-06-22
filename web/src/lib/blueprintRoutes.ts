import type { BlueprintLaneId, BlueprintMode } from "./types";

export const BLUEPRINT_LANE_ROUTES: Record<BlueprintLaneId, string> = {
  step1: "step",
  step2: "step2",
  dedicated: "dedicated",
  shelf: "shelf",
  step3: "step3",
  premed: "premed",
  mcat: "mcat",
  dat: "dat",
  casper: "casper",
};

export const BLUEPRINT_ROUTE_LANES: Record<string, BlueprintLaneId> = Object.fromEntries(
  Object.entries(BLUEPRINT_LANE_ROUTES).map(([lane, route]) => [route, lane]),
) as Record<string, BlueprintLaneId>;

export function routeForBlueprintLane(laneId: BlueprintLaneId): string {
  return BLUEPRINT_LANE_ROUTES[laneId];
}

export function laneForBlueprintRoute(route: string): BlueprintLaneId | undefined {
  return BLUEPRINT_ROUTE_LANES[route];
}

export function modeForBlueprintLane(laneId: BlueprintLaneId): BlueprintMode {
  return ["premed", "mcat", "dat", "casper"].includes(laneId) ? "prehealth" : "usmle";
}
