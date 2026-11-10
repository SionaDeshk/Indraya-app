import { useState } from "react";
import { Text, View } from "react-native";
import * as Linking from "expo-linking";
import { Button, styles } from "./ui";
import ChoiceChips from "./ChoiceChips";
import WeatherStation from "./WeatherStation";
import Disclosure from "./Disclosure";
import { regionalLinks, sourceRegion, SourceRegion } from "./regionalSources";
export default function RegionalSources({
  place = "",
  type,
  coordinate,
}: {
  place?: string;
  type?: string;
  coordinate?: [number, number];
}) {
  const [region, setRegion] = useState<SourceRegion>(() => sourceRegion(place));
  const [message, setMessage] = useState("");
  if (type && regionalLinks(region, type).length === 0) return null;
  return (
    <Disclosure label="Local forecasts & updates">
      <Text style={styles.text}>
        Official sources open in your browser. Choose the matching forecast area
        and check its issue time.
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
        onChange={(v) => setRegion(v as SourceRegion)}
      />
      {regionalLinks(region, type).map((link) => (
        <Button
          key={link.url}
          label={link.label}
          onPress={() => {
            setMessage("");
            void Linking.openURL(link.url).catch(() =>
              setMessage("Could not open the source. Check your connection."),
            );
          }}
        />
      ))}
      {coordinate && (
        <WeatherStation longitude={coordinate[0]} latitude={coordinate[1]} />
      )}
      <Text style={[styles.text, { fontSize: 12 }]}>
        No external forecast is loaded here. Community observations and
        moderator notes are not avalanche forecasts.
      </Text>
      {!!message && (
        <View>
          <Text accessibilityRole="alert" style={styles.text}>
            {message}
          </Text>
        </View>
      )}
    </Disclosure>
  );
}
