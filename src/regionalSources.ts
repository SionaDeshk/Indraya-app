export type SourceRegion = "hatcher" | "anchorage" | "girdwood" | "other";
export type SourceLink = { label: string; url: string };
export function sourceRegion(place: string): SourceRegion {
  return /hatcher|archangel|independence|hatch peak|microdot|skyscraper/i.test(
    place,
  )
    ? "hatcher"
    : /girdwood|turnagain|tincan|alyeska/i.test(place)
      ? "girdwood"
      : /anchorage|kincaid|hillside|eklutna/i.test(place)
        ? "anchorage"
        : "other";
}
export function regionalLinks(region: SourceRegion, type = ""): SourceLink[] {
  const links: SourceLink[] = [];
  const snow =
    /avalanche|snow|ski|ice|winter|visibility|wind/.test(type) || !type;
  if (snow)
    links.push(
      region === "hatcher"
        ? {
            label: "Hatcher Pass Avalanche Center · forecast",
            url: "https://hpavalanche.org/",
          }
        : region === "girdwood" || region === "anchorage"
          ? {
              label: "Chugach Avalanche Center · choose forecast area",
              url: "https://www.cnfaic.org/",
            }
          : {
              label: "Alaska avalanche center directory",
              url: "https://alaskasnow.org/",
            },
    );
  if (/weather|snow|wind|rain|visibility|avalanche|ice|ski/.test(type) || !type)
    links.push({
      label: "National Weather Service · Alaska",
      url: "https://www.weather.gov/arh/",
    });
  if (/road|traffic|collision|vehicle|access|motor/.test(type))
    links.push({
      label: "Alaska 511 · road conditions",
      url: "https://511.alaska.gov/",
    });
  if (/groom|nordic|cross_country|ski_trail/.test(type)) {
    const clubs: Record<SourceRegion, SourceLink> = {
      hatcher: {
        label: "Mat-Su Ski Club · trail updates",
        url: "https://www.matsuski.org/",
      },
      anchorage: {
        label: "Anchorage Nordic · trail updates",
        url: "https://anchoragenordicski.com/",
      },
      girdwood: {
        label: "Girdwood Nordic Ski Club · trail updates",
        url: "https://girdwoodnordicskiclub.org/",
      },
      other: {
        label: "Alaska State Parks · access notices",
        url: "https://dnr.alaska.gov/parks/",
      },
    };
    links.push(clubs[region]);
  }
  if (/fish|wildlife|bear|moose|hunt|caribou|sheep/.test(type))
    links.push({
      label: "Alaska Fish and Game · notices and regulations",
      url: "https://www.adfg.alaska.gov/",
    });
  if (
    !links.length &&
    /trail|park|access|climb|camp|water|landslide|rockfall/.test(type)
  )
    links.push({
      label: "Alaska State Parks · access notices",
      url: "https://dnr.alaska.gov/parks/",
    });
  return links;
}
