export type FeedId = "weather" | "earthquakes";
export const officialSources = {
  weather: {
    name: "National Weather Service",
    label: "Weather alerts",
    endpoint: "https://api.weather.gov/alerts/active?area=AK",
    website: "https://www.weather.gov/afc/",
    documentation: "https://www.weather.gov/documentation/services-web-api",
    terms: "https://www.weather.gov/disclaimer",
    // Enable only after recording endpoint + terms validation in docs/official-sources.md.
    validatedAt: null as string | null,
  },
  earthquakes: {
    name: "USGS",
    label: "Earthquakes · M2.5+ · past day",
    endpoint:
      "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson",
    website: "https://earthquake.usgs.gov/earthquakes/map/",
    documentation:
      "https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php",
    terms:
      "https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits",
    validatedAt: null as string | null,
  },
} as const;
export const pendingSources = [
  {
    name: "Wildfire incidents",
    description:
      "NIFC incident locations and Alaska coverage are being evaluated. No fire incident feed is connected.",
    website: "https://www.nifc.gov/",
  },
  {
    name: "Alaska 511 · road conditions",
    description:
      "Road reports require validation of the official feed and its access terms. Not connected.",
    website: "https://511.alaska.gov/",
  },
  {
    name: "311 · local service requests",
    description:
      "311 is for municipal issues; it is separate from 511 travel conditions. Anchorage coverage and a permitted data source need confirmation. Not connected.",
    website: "https://www.muni.org/",
  },
];
