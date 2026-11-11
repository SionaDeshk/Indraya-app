import travel from "../assets/map-symbols/travel.png";
import wildlife from "../assets/map-symbols/wildlife.png";
import outdoors from "../assets/map-symbols/outdoors.png";
import weather from "../assets/map-symbols/weather.png";
import environment from "../assets/map-symbols/environment.png";
import community from "../assets/map-symbols/community.png";
import safety from "../assets/map-symbols/safety.png";
import discoveries from "../assets/map-symbols/discoveries.png";
import type { ImageRequireSource } from "react-native";
import { DomainId } from "./taxonomy";
export const mapSymbols: Record<
  DomainId,
  { label: string; image: ImageRequireSource }
> = {
  travel: {
    label: "Road / transportation",
    image: travel,
  },
  wildlife: {
    label: "Animal / wildlife",
    image: wildlife,
  },
  outdoors: {
    label: "Trail / recreation",
    image: outdoors,
  },
  weather: {
    label: "Weather / natural conditions",
    image: weather,
  },
  environment: {
    label: "Fire / environment",
    image: environment,
  },
  community: {
    label: "Community / infrastructure",
    image: community,
  },
  safety: {
    label: "Safety / assistance",
    image: safety,
  },
  discoveries: {
    label: "Discovery / other",
    image: discoveries,
  },
};
