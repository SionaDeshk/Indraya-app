import { Text, View } from "react-native";
export default function NativeMap(_: unknown) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0a2027",
        justifyContent: "center",
        padding: 35,
      }}
    >
      <Text style={{ color: "#9bc9c6" }}>
        Native map requires an iOS or Android development build. Use the
        observation cards below to explore the demo.
      </Text>
    </View>
  );
}
