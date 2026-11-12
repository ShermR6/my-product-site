// MapLibre runs its tile work in a worker that has to be served as a file of
// its own. This copies it out of the package into public/ so the copy can never
// drift from the installed version. Runs before dev and build.
import { copyFileSync, mkdirSync } from "node:fs";

mkdirSync("public/maplibre", { recursive: true });
copyFileSync("node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs", "public/maplibre/maplibre-gl-worker.mjs");
