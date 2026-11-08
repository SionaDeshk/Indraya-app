import { ReactNode, useMemo } from "react";
import { PanResponder, Pressable, Text, View } from "react-native";
/** Only the handle owns the drag gesture; map and report-list scrolling remain independent. */
export default function ActivitySheet({
  expanded,
  onChange,
  title,
  children,
  bottom,
  maxHeight,
}: {
  expanded: boolean;
  onChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  bottom: number;
  maxHeight: number;
}) {
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) =>
          Math.abs(g.dy) > 12 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderRelease: (_e, g) => {
          if (g.dy < -25) onChange(true);
          else if (g.dy > 25) onChange(false);
        },
      }),
    [onChange],
  );
  return (
    <View
      style={{
        position: "absolute",
        bottom,
        left: 12,
        right: 12,
        maxHeight,
        backgroundColor: "#10282c",
        borderRadius: 22,
        borderWidth: 1,
        borderColor: "#29464a",
        overflow: "hidden",
      }}
    >
      <View {...pan.panHandlers}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            expanded ? "Collapse nearby activity" : "Expand nearby activity"
          }
          accessibilityState={{ expanded }}
          accessibilityHint="Tap, or swipe the handle up or down."
          onPress={() => onChange(!expanded)}
          style={{
            paddingHorizontal: 18,
            paddingTop: 10,
            paddingBottom: 15,
            minHeight: 64,
            gap: 9,
          }}
        >
          <View
            style={{
              width: 34,
              height: 4,
              borderRadius: 2,
              backgroundColor: "#69898d",
              alignSelf: "center",
            }}
          />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text
              style={{
                color: "#e6f4ef",
                fontSize: 14,
                fontWeight: "600",
                flex: 1,
              }}
            >
              {title}
            </Text>
            <Text style={{ color: "#9ce5d9" }}>{expanded ? "⌄" : "⌃"}</Text>
          </View>
        </Pressable>
      </View>
      {expanded && (
        <View style={{ flexShrink: 1, minHeight: 0 }}>{children}</View>
      )}
    </View>
  );
}
