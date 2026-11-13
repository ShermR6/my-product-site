// The tracked aircraft as the map draws them. Shared by the Live Map and the
// dashboard so both show the same thing.

import type { MapPlane } from "../_components/MapGL";
import { inboundOf, parseUtc } from "./format";
import { paintOf } from "./paint";
import type { Aircraft, AirportConfig, LiveAircraft } from "./types";

export function mapPlanes(
  live: LiveAircraft[], fleet: Aircraft[], airport: AirportConfig | null, paints: Record<string, string>,
): MapPlane[] {
  const inbound = new Set(inboundOf(live, fleet, airport).map((a) => a.tail_number));
  return live
    .filter((a) => a.latitude != null && a.longitude != null)
    .map((a) => ({
      tail: a.tail_number, lat: a.latitude as number, lon: a.longitude as number, heading: a.heading,
      live: inbound.has(a.tail_number), dim: !!a.on_ground,
      type: fleet.find((x) => x.tail_number === a.tail_number)?.aircraft_type, color: paintOf(a.tail_number, paints),
      speedKt: a.velocity_kts,
      seenAt: parseUtc(a.last_seen)?.getTime() ?? null,
      altFt: a.altitude_ft_agl ?? (a.altitude_ft_msl != null ? a.altitude_ft_msl - (airport?.elevation_ft_msl ?? 0) : null),
    }));
}
