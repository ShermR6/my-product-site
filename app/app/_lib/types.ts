// Shapes returned by the tracker backend (aircraft-tracker-backend), as the
// web app uses them. Timestamps are ISO strings in UTC, usually without a zone
// suffix: parse them with parseUtc() from ./format.

export type Me = {
  id: string;
  email: string;
  display_name: string | null;
  license_tier: string;
  expires_at: string | null;
};

export type Aircraft = {
  id: string;
  tail_number: string;
  icao24: string | null;
  friendly_name: string | null;
  aircraft_type: string | null;
  alert_distances: number[] | null;
  active: boolean;
  created_at: string;
};

export type LiveAircraft = {
  tail_number: string;
  icao24: string | null;
  status: string;
  on_ground: boolean | null;
  distance_nm: number;
  altitude_ft_agl: number | null;
  altitude_ft_msl: number | null;
  velocity_kts: number | null;
  heading: number | null;
  is_approaching: boolean;
  last_seen: string;
  latitude: number | null;
  longitude: number | null;
  source: string | null;
};

export type Runway = {
  leIdent: string | null;
  leHdg: number | null;
  heIdent: string | null;
  heHdg: number | null;
  lengthFt: number | null;
  leLat?: number | null;
  leLon?: number | null;
  heLat?: number | null;
  heLon?: number | null;
};

export type AirportConfig = {
  id: string;
  airport_code: string | null;
  airport_name: string | null;
  latitude: string;
  longitude: string;
  elevation_ft_msl: number;
  alert_distances_nm: (string | number)[] | null;
  runway_info: Runway[] | null;
  approach_corridor_enabled: boolean | null;
  approach_runway_heading: number | null;
  approach_runway_headings: number[] | null;
  quiet_hours_enabled: boolean | null;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
};

export type AirportMatch = {
  icao: string;
  name: string;
  city: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  elev: number;
  iata: string;
  runways: Runway[];
};

export type Integration = {
  id: string;
  type: string;
  config: Record<string, string | undefined>;
  enabled: boolean;
  created_at: string;
};

export type NotificationLog = {
  id: string;
  aircraft_tail: string;
  alert_type: string;
  message: string;
  integration_type: string;
  status: string;
  sent_at: string;
};

export type LogsPage = { logs: NotificationLog[]; total: number; page: number; pages: number };

export type AlertSetting = {
  id: string;
  alert_type: string;
  enabled: boolean;
  message_template: string;
};

export type Routing = Record<string, string[]>;

export type GroundStats = {
  version?: string;
  uptime_s?: number;
  msg_rate?: number;
  aircraft_count?: number;
};

export type GroundStatus = {
  online: boolean;
  last_seen: string | null;
  last_seen_seconds: number | null;
  gs_device_key: string | null;
  stats: GroundStats | null;
};

export type GroundRange = {
  range_nm: number[] | null;
  updated_at: string | null;
  receiver_lat: number | null;
  receiver_lon: number | null;
};

export type SavedLocation = {
  id: string;
  name: string;
  airport_code: string | null;
  latitude: string;
  longitude: string;
  elevation_ft_msl: number | null;
  is_active: boolean;
};
