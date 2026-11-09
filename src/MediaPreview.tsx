import { useEffect, useRef, useState } from "react";
import { Image, Text, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
function Clip({ uri, label }: { uri: string; label: string }) {
  const [error, setError] = useState("");
  const initial = useRef(uri),
    previous = useRef(uri);
  const player = useVideoPlayer(initial.current, (p) => {
    p.loop = false;
  });
  useEffect(() => {
    const listener = player.addListener("statusChange", (event) => {
      setError(
        event.status === "error"
          ? "This video could not be played. Try reopening it or choosing another clip."
          : "",
      );
    });
    return () => listener.remove();
  }, [player]);
  useEffect(() => {
    if (previous.current === uri) return;
    const sameClip = previous.current.split("?")[0] === uri.split("?")[0];
    const position = sameClip ? player.currentTime : 0,
      playing = sameClip && player.playing;
    previous.current = uri;
    let active = true;
    void player
      .replaceAsync(uri)
      .then(() => {
        if (!active) return;
        player.currentTime = position;
        if (playing) player.play();
      })
      .catch(() => {
        if (active)
          setError("This video could not be loaded. Try reopening it.");
      });
    return () => {
      active = false;
    };
  }, [uri, player]);
  return (
    <View accessibilityLabel={label}>
      <VideoView
        player={player}
        style={{ width: "100%", height: 220, borderRadius: 16 }}
        nativeControls
        fullscreenOptions={{ enable: true }}
      />
      {!!error && (
        <Text
          accessibilityRole="alert"
          style={{ color: "#e6c68b", lineHeight: 22 }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
export default function MediaPreview({
  uri,
  kind = "photo",
  label,
}: {
  uri: string;
  kind?: "photo" | "video";
  label: string;
}) {
  return kind === "video" ? (
    <Clip uri={uri} label={label} />
  ) : (
    <Image
      accessibilityLabel={label}
      source={{ uri }}
      style={{ width: "100%", height: 210, borderRadius: 16 }}
      resizeMode="contain"
    />
  );
}
