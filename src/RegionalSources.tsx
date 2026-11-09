import { useState } from "react";
import { Text, View } from "react-native";
import * as Linking from "expo-linking";
import { Button, styles } from "./ui";
import ChoiceChips from "./ChoiceChips";
const sources = {
  hatcher: [
    ["Hatcher Pass Avalanche Center", "https://hpavalanche.org/"],
    ["Mat-Su Ski Club", "https://www.matsuski.org/"],
    ["Alaska State Parks · access notices", "https://dnr.alaska.gov/parks/"],
  ],
  anchorage: [
    [
      "Nordic Skiing Association of Anchorage",
      "https://anchoragenordicski.com/",
    ],
    [
      "Chugach avalanche information · check forecast coverage",
      "https://www.cnfaic.org/",
    ],
    ["Alaska State Parks · closures", "https://dnr.alaska.gov/parks/"],
  ],
  girdwood: [
    [
      "Chugach avalanche information · check forecast coverage",
      "https://www.cnfaic.org/",
    ],
    ["Girdwood Nordic Ski Club", "https://girdwoodnordicskiclub.org/"],
    [
      "Chugach National Forest · access notices",
      "https://www.fs.usda.gov/r10/chugach",
    ],
  ],
  other: [
    ["Alaska avalanche center directory", "https://alaskasnow.org/"],
    ["Alaska Department of Fish and Game", "https://www.adfg.alaska.gov/"],
    ["Alaska State Parks", "https://dnr.alaska.gov/parks/"],
  ],
};
export default function RegionalSources({
  place = "",
  type,
}: {
  place?: string;
  type?: string;
}) {
  const initial: keyof typeof sources = /hatcher|archangel|independence/i.test(
    place,
  )
    ? "hatcher"
    : /girdwood|turnagain/i.test(place)
      ? "girdwood"
      : /anchorage|kincaid|hillside/i.test(place)
        ? "anchorage"
        : "other";
  const [open, setOpen] = useState(false),
    [region, setRegion] = useState<keyof typeof sources>(initial),
    [message, setMessage] = useState("");
  const openURL = (url: string) => {
    void Linking.openURL(url).catch(() =>
      setMessage("Could not open the provider. Check your connection."),
    );
  };
  return (
    <View style={{ gap: 10 }}>
      <Button
        label={
          open
            ? "Hide regional source links"
            : "Regional forecasts, trails and access"
        }
        onPress={() => setOpen(!open)}
      />
      {open && (
        <>
          <Text style={styles.text}>
            External websites, not live updates in Indraya. Check the provider's
            area, publication time and current notices. A community observation
            does not establish legal access or safe conditions.
          </Text>
          <ChoiceChips
            label="Area"
            value={region}
            options={[
              { value: "hatcher", label: "Hatcher Pass" },
              { value: "anchorage", label: "Anchorage" },
              { value: "girdwood", label: "Girdwood / Turnagain" },
              { value: "other", label: "Other Alaska" },
            ]}
            onChange={(v) => setRegion(v as keyof typeof sources)}
          />
          {sources[region].map(([name, url]) => (
            <Button
              key={url}
              label={`Open ${name}`}
              onPress={() => openURL(url)}
            />
          ))}
          {type === "fish_activity" && region !== "other" && (
            <Button
              label="Open Alaska Fish and Game · regulations / counts"
              onPress={() => openURL("https://www.adfg.alaska.gov/")}
            />
          )}
          <Text style={styles.text}>
            Source links and coverage still need local verification. No
            forecast, grooming report or fish count has been loaded here.
          </Text>
        </>
      )}
      {!!message && (
        <Text accessibilityRole="alert" style={styles.text}>
          {message}
        </Text>
      )}
    </View>
  );
}
