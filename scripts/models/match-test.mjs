// Check that type names land on the right model.  node scripts/models/match-test.mjs
import { CATALOG } from "./catalog.mjs";

const word = (p) => new RegExp(`\\b(?:${p})\\b`);
const list = CATALOG.map(([id, , , exact, alias]) => ({ id, exact: word(exact), alias: alias ? word(alias) : null }));
function modelOf(type) {
  const t = type.toUpperCase().replace(/TEXTRON AVIATION( INC)?/g, "CESSNA").replace(/\s+/g, " ").trim();
  for (const m of list) if (m.exact.test(t)) return m.id;
  for (const m of list) if (m.alias?.test(t)) return m.id + "~";
  return "-";
}

// [type as the registry or a feed gives it, expected model ("~" = borrowed, "-" = built-in shape)]
const CASES = [
  ["CESSNA 172S", "c172"], ["C172", "c172"], ["172S", "c172"], ["TEXTRON AVIATION INC 172S", "c172"], ["CESSNA 177RG", "c172~"],
  ["CESSNA 150M", "c150"], ["CESSNA 152", "c152"], ["CESSNA 170B", "c170"], ["CESSNA 180K", "c170~"], ["CESSNA A185F", "c170~"],
  ["CESSNA 182T", "c182"], ["CESSNA T182T", "c182"], ["CESSNA R182", "c82r"], ["CESSNA TR182", "c82r"], ["CESSNA T210N", "c82r~"],
  ["CESSNA U206G", "c182~"], ["CESSNA T206H", "c182~"], ["CESSNA 208B", "c208"], ["C208", "c208"], ["CESSNA 337G", "c337"],
  ["CESSNA 421C", "c421"], ["CESSNA 310R", "c421~"], ["CESSNA 340A", "c421~"], ["CESSNA 414A", "c421~"],
  ["CESSNA 525B", "c525"], ["C25B", "c525"], ["CESSNA 560XL", "c525~"], ["C56X", "c525~"], ["CESSNA 550", "c550"], ["CESSNA 750", "c750"], ["CESSNA 680", "c525~"],
  ["PIPER PA-28-181", "pa28"], ["PIPER PA-28-180", "pa28"], ["PIPER PA-28R-201", "pa28"], ["P28A", "pa28"], ["PIPER PA-32R-301T", "pa32"], ["PIPER PA-32-300", "pa32"],
  ["PIPER PA-18-150", "pa18"], ["PIPER J3C-65", "j3"], ["PIPER PA-22-150", "pa22"], ["PIPER PA-20", "pa20"],
  ["PIPER PA-34-200T", "-"], ["PIPER PA-44-180", "-"], ["PIPER PA-46-350P", "-"], ["PIPER PA-31-350", "-"], ["PIPER PA-60-601P", "aest"],
  ["BEECH 58", "-"], ["BEECH A36", "-"], ["BEECH J35", "be35"], ["BEECH V35B", "be35"], ["BEECH B200", "be20"], ["BEECH C90A", "be20~"], ["BEECH B300", "b350"], ["BE20", "be20"], ["BEECH D18S", "be18"],
  ["CIRRUS DESIGN CORP SR22", "sr22"], ["CIRRUS DESIGN CORP SR20", "sr22"], ["CIRRUS DESIGN CORP SF50", "-"], ["SR22T", "sr22"],
  ["DIAMOND AIRCRAFT IND INC DA 40", "da40"], ["DIAMOND AIRCRAFT IND INC DA 42", "da42"], ["DIAMOND AIRCRAFT IND INC DA 20-C1", "dv20"], ["DA62", "da42~"],
  ["MOONEY M20J", "-"], ["GRUMMAN AMERICAN AVN. CORP. AA-5B", "aa1~"], ["EXTRA 300", "-"], ["AVIAT A-1B", "-"], ["VANS RV-7", "-"],
  ["PILATUS PC-12/47E", "pc12"], ["PC12", "pc12"], ["SOCATA TBM 700", "-"], ["PILATUS PC-24", "-"],
  ["ROBINSON HELICOPTER COMPANY R44 II", "r44"], ["ROBINSON HELICOPTER R22 BETA", "r44~"], ["R66", "r44~"], ["BELL 206B", "b06"], ["BELL 407", "b407"], ["BELL 429", "b407~"],
  ["BELL UH-1H", "uh1"], ["BELL 412EP", "uh1"], ["SIKORSKY UH-60A", "uh60"], ["SIKORSKY S-76C", "uh60~"], ["EUROCOPTER AS 350 B3", "as350"], ["AIRBUS HELICOPTERS H125", "as350"],
  ["EUROCOPTER EC 130 B4", "ec130"], ["EUROCOPTER DEUTSCHLAND GMBH EC 135 P2+", "ec135"], ["EC45", "ec145"], ["MBB-BK 117 C-2", "bk117"], ["MBB BO-105S", "bo105"],
  ["MD HELICOPTERS INC 369E", "h500"], ["HUGHES 369D", "h500"], ["MD 900", "md900"], ["AGUSTA AW139", "aw139"], ["AGUSTA A109E", "aw139~"], ["SCHWEIZER 269C", "h500~"],
  ["BOEING 737-8H4", "b738"], ["BOEING 737-7H4", "b737"], ["B738", "b738"], ["B38M", "b738"], ["BOEING 737-924ER", "b739"], ["BOEING 737-3H4", "b733"], ["BOEING 737 MAX 8", "b738~"],
  ["BOEING 747-8F", "b748"], ["BOEING 747-446", "b744"], ["BOEING 757-232", "b752"], ["BOEING 767-332", "b763"], ["BOEING 777-222", "b772"], ["B77W", "b773"], ["BOEING 787-9", "b789"], ["B78X", "b789~"],
  ["BOEING 717-200", "b712"], ["MD-88", "b712~"], ["BOEING A75N1(PT17)", "st75"], ["BOEING E75", "st75"],
  ["AIRBUS A320-214", "a320"], ["A20N", "a320"], ["AIRBUS A321-231", "a321"], ["AIRBUS A319-112", "a319"], ["AIRBUS A330-243", "a332"], ["AIRBUS A330-343", "a333"], ["A339", "a333"],
  ["AIRBUS A350-941", "a359"], ["AIRBUS A380-861", "a388"], ["AIRBUS A220-300", "bcs3"], ["BCS1", "bcs1"], ["AIRBUS A340-313", "a343"], ["AIRBUS A340-642", "a346"],
  ["EMBRAER ERJ 170-200 LR", "e170"], ["E75L", "e170"], ["EMBRAER ERJ 190-100 IGW", "e190"], ["EMBRAER EMB-145LR", "e145"], ["E145", "e145"], ["EMBRAER EMB-505", "-"],
  ["BOMBARDIER INC CL-600-2B19", "crj2"], ["BOMBARDIER INC CL-600-2C10", "crj7"], ["BOMBARDIER INC CL-600-2D24", "crj9"], ["CRJ9", "crj9"], ["CRJ2", "crj2"],
  ["ATR 72-212A", "at72"], ["AT76", "at72"], ["ATR 42-500", "at45"], ["DE HAVILLAND DHC-8-402", "dh8d"], ["DH8D", "dh8d"], ["DE HAVILLAND DHC-8-311", "dh8c"], ["DH8A", "dh8c~"],
  ["GULFSTREAM AEROSPACE G-V", "glf5"], ["GULFSTREAM AEROSPACE GVI(G650ER)", "glf5~"], ["GLF4", "glf5~"], ["GLEX", "glf5~"], ["DASSAULT FALCON 50", "fa50"], ["DASSAULT FALCON 900EX", "fa50~"],
  ["HAWKER 800XP", "h25b"], ["H25B", "h25b"], ["LEARJET 45", "-"], ["C-17A", "c17"], ["LOCKHEED C-130H", "c130"], ["C130", "c130"], ["C170", "c170"], ["C17", "c17"],
  ["PIAGGIO P.180", "p180"], ["BEECH 2000A", "star"], ["SCHLEICHER ASK 21", "ask21"], ["AEROSPATIALE AS 332 L1", "-"], ["AS32", "-"], ["GLID", "ask21~"],
  ["ZENITH CH 750", "ch750"], ["TECNAM P2006T", "p06t"], ["TECNAM P92", "p92"], ["JABIRU J170", "jab"], ["BRITTEN-NORMAN BN-2A", "bn2"], ["DORNIER 228-212", "d228"],
];

let bad = 0;
for (const [type, want] of CASES) {
  const got = modelOf(type);
  if (got !== want) { bad++; console.log(`WRONG  ${type.padEnd(42)} got ${got.padEnd(8)} expected ${want}`); }
}
console.log(`${CASES.length - bad} of ${CASES.length} right`);
process.exit(bad ? 1 : 0);
