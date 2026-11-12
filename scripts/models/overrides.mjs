// Per-aircraft corrections for the converter, found by looking at the contact sheets.
//   skip: reason     leave this source out
//   ac: [files]      use these .ac files (relative to the aircraft folder) instead of the detected ones
//   also: [files]    add these .ac files
//   not: regex       leave out detected files whose path matches
//   orient / turn    which way the source model faces (see ORIENT in lib.mjs)
//   drop / keep      regex on object names to leave out / force in
//   heli, noSpin     treat rotors / do not animate anything

export const OVERRIDES = {
  "fg-737-800": { skip: "fuselage only; the wings are not in the main model" },
  "fg-a380": { skip: "placeholder shape" },
  "fg-ec135": { skip: "no rotor in the model; the Flightradar24 helicopter is an EC135" },
  "fg-do-328-jet": { skip: "Blender source only" },
  "fg-dhc3": { skip: "the model file stores its parts spread out" },
  "fg-dr400": { ac: ["Models/dr400.ac"] },
  "fg-c172p": { drop: /(landinglight|taxilight)$/ },
  "fg-citation": { drop: /(dazzle|corona|area\.tip)/ },
  "fg-c182s": { drop: /(Strobe|Plane\.002X|ExtLight)/ },
  "amv-drone": { skip: "not an aircraft type the app tracks" },
  "amv-evtol": { skip: "not an aircraft type the app tracks" },
};
