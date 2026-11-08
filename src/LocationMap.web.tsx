import { View, Text } from "react-native";
import { styles } from "./ui";
import type { LocationMapProps } from "./LocationMap";
export default function LocationMap(_: LocationMapProps) {
  return (
    <View style={[styles.card, { flex: 1, justifyContent: "center" }]}>
      <Text style={styles.text}>
        Drop a pin in the iPhone or Android app. In the browser, search for a
        place or use your current location.
      </Text>
    </View>
  );
}
