// Display names for the homepage globe: airline ICAO codes and ICAO aircraft
// type designators. Codes not listed are shown as they are.

export const AIRLINES: Record<string, string> = {
  AAL: "American Airlines", DAL: "Delta Air Lines", UAL: "United Airlines", SWA: "Southwest Airlines",
  JBU: "JetBlue", ASA: "Alaska Airlines", NKS: "Spirit Airlines", FFT: "Frontier Airlines",
  HAL: "Hawaiian Airlines", SKW: "SkyWest", RPA: "Republic Airways", ENY: "Envoy Air",
  EDV: "Endeavor Air", JIA: "PSA Airlines", ASH: "Mesa Airlines", AAY: "Allegiant Air",
  SCX: "Sun Country", FDX: "FedEx", UPS: "UPS Airlines", GTI: "Atlas Air", ABX: "ABX Air",
  ACA: "Air Canada", JZA: "Air Canada Jazz", WJA: "WestJet", ROU: "Air Canada Rouge", TSC: "Air Transat",
  AMX: "Aeroméxico", VOI: "Volaris", VIV: "Viva Aerobus", CMP: "Copa Airlines", AVA: "Avianca",
  LAN: "LATAM", TAM: "LATAM Brasil", GLO: "Gol", AZU: "Azul", ARG: "Aerolíneas Argentinas",
  BAW: "British Airways", VIR: "Virgin Atlantic", EZY: "easyJet", EJU: "easyJet Europe", RYR: "Ryanair",
  EIN: "Aer Lingus", AFR: "Air France", KLM: "KLM", DLH: "Lufthansa", EWG: "Eurowings",
  SWR: "Swiss", AUA: "Austrian Airlines", BEL: "Brussels Airlines", SAS: "SAS", NAX: "Norwegian",
  FIN: "Finnair", IBE: "Iberia", VLG: "Vueling", AEA: "Air Europa", TAP: "TAP Air Portugal",
  ITY: "ITA Airways", WZZ: "Wizz Air", LOT: "LOT Polish Airlines", THY: "Turkish Airlines",
  PGT: "Pegasus", AEE: "Aegean", ICE: "Icelandair", TOM: "TUI Airways", CFG: "Condor",
  UAE: "Emirates", QTR: "Qatar Airways", ETD: "Etihad", SVA: "Saudia", FDB: "flydubai",
  GFA: "Gulf Air", OMA: "Oman Air", RJA: "Royal Jordanian", ELY: "El Al", MSR: "EgyptAir",
  ETH: "Ethiopian Airlines", KQA: "Kenya Airways", SAA: "South African Airways", RAM: "Royal Air Maroc",
  AIC: "Air India", IGO: "IndiGo", AXB: "Air India Express", SIA: "Singapore Airlines", TGW: "Scoot",
  MAS: "Malaysia Airlines", AXM: "AirAsia", THA: "Thai Airways", GIA: "Garuda Indonesia",
  PAL: "Philippine Airlines", CEB: "Cebu Pacific", HVN: "Vietnam Airlines", VJC: "VietJet",
  CPA: "Cathay Pacific", HKE: "HK Express", CCA: "Air China", CES: "China Eastern",
  CSN: "China Southern", CHH: "Hainan Airlines", CXA: "Xiamen Airlines", CSZ: "Shenzhen Airlines",
  KAL: "Korean Air", AAR: "Asiana Airlines", JJA: "Jeju Air", JAL: "Japan Airlines", ANA: "All Nippon Airways",
  APJ: "Peach", EVA: "EVA Air", CAL: "China Airlines", QFA: "Qantas", JST: "Jetstar",
  VOZ: "Virgin Australia", ANZ: "Air New Zealand", FJI: "Fiji Airways",
};

export const AIRCRAFT_TYPES: Record<string, string> = {
  A19N: "Airbus A319neo", A20N: "Airbus A320neo", A21N: "Airbus A321neo",
  A318: "Airbus A318", A319: "Airbus A319", A320: "Airbus A320", A321: "Airbus A321",
  A332: "Airbus A330-200", A333: "Airbus A330-300", A338: "Airbus A330-800", A339: "Airbus A330-900",
  A343: "Airbus A340-300", A346: "Airbus A340-600", A359: "Airbus A350-900", A35K: "Airbus A350-1000",
  A388: "Airbus A380", BCS1: "Airbus A220-100", BCS3: "Airbus A220-300",
  B712: "Boeing 717", B733: "Boeing 737-300", B734: "Boeing 737-400", B735: "Boeing 737-500",
  B737: "Boeing 737-700", B738: "Boeing 737-800", B739: "Boeing 737-900",
  B37M: "Boeing 737 MAX 7", B38M: "Boeing 737 MAX 8", B39M: "Boeing 737 MAX 9", B3XM: "Boeing 737 MAX 10",
  B744: "Boeing 747-400", B748: "Boeing 747-8", B752: "Boeing 757-200", B753: "Boeing 757-300",
  B762: "Boeing 767-200", B763: "Boeing 767-300", B764: "Boeing 767-400",
  B772: "Boeing 777-200", B77L: "Boeing 777-200LR", B773: "Boeing 777-300", B77W: "Boeing 777-300ER",
  B778: "Boeing 777-8", B779: "Boeing 777-9", B788: "Boeing 787-8", B789: "Boeing 787-9", B78X: "Boeing 787-10",
  E170: "Embraer E170", E175: "Embraer E175", E75L: "Embraer E175", E75S: "Embraer E175",
  E190: "Embraer E190", E195: "Embraer E195", E290: "Embraer E190-E2", E295: "Embraer E195-E2",
  CRJ2: "Bombardier CRJ200", CRJ7: "Bombardier CRJ700", CRJ9: "Bombardier CRJ900", CRJX: "Bombardier CRJ1000",
  AT72: "ATR 72", AT76: "ATR 72-600", AT75: "ATR 72-500", DH8D: "Dash 8-400",
  MD11: "McDonnell Douglas MD-11", C919: "COMAC C919", SU95: "Sukhoi Superjet 100",
};

export function airlineName(code: string): string | null {
  return AIRLINES[code] ?? null;
}

export function aircraftTypeName(code: string | null): string | null {
  if (!code) return null;
  return AIRCRAFT_TYPES[code] ?? code;
}
