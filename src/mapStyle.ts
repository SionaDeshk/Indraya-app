import type { StyleSpecification } from "@maplibre/maplibre-react-native";
/** Development topographic provider; see README for attribution, usage limits and production hosting. */
export const topographicStyle: StyleSpecification = {
  version: 8,
  sources: {
    topography: {
      type: "raster",
      tiles: ["https://tile.opentopomap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      maxzoom: 17,
      attribution:
        "© OpenStreetMap contributors · SRTM | © OpenTopoMap (CC-BY-SA)",
    },
  },
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#0a2027" },
    },
    { id: "topography", type: "raster", source: "topography" },
  ],
};
