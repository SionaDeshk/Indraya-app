import { Image, View } from "react-native";
import { Observation, reportAppearance } from "./domain";
import { observationSymbol } from "./observationSymbols";
import { eventSymbolImages } from "./eventSymbolImages";
import { mapSymbols } from "./mapSymbols";
export default function ObservationIcon({
  report,
  size = 32,
}: {
  report: Observation;
  size?: number;
}) {
  const icon = observationSymbol(report);
  const image =
    eventSymbolImages[icon.symbol] ??
    mapSymbols[icon.symbol as keyof typeof mapSymbols]?.image;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: reportAppearance(report).color,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Image
        source={image}
        style={{ width: size * 0.72, height: size * 0.72 }}
        accessible={false}
      />
    </View>
  );
}
