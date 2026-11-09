import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { File, Paths } from "expo-file-system";
import { Platform } from "react-native";
import {
  MAX_VIDEO_BYTES,
  sanitizeVideo,
} from "../supabase/functions/_shared/video";
import {
  decodeBase64,
  encodeBase64,
  sanitizeJpeg,
} from "../supabase/functions/_shared/media";
export type PreparedPhoto = {
  base64: string;
  uri: string;
  kind?: "photo" | "video";
  mime?: string;
  duration?: number;
};
export async function pickVideo(): Promise<PreparedPhoto | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted)
    throw Error(
      "Video access was declined. You can share without an attachment.",
    );
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["videos"],
    allowsEditing: false,
    videoExportPreset: ImagePicker.VideoExportPreset.H264_1280x720,
    exif: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (
    !asset ||
    (asset.fileSize && asset.fileSize > MAX_VIDEO_BYTES) ||
    (asset.duration && asset.duration > 60000)
  )
    throw Error("Choose an MP4 or MOV clip up to 60 seconds and 20 MB.");
  let bytes: Uint8Array;
  if (Platform.OS === "web") {
    const response = await fetch(asset.uri),
      blob = await response.blob();
    if (blob.size > MAX_VIDEO_BYTES) throw Error("Choose a video under 20 MB.");
    bytes = new Uint8Array(await blob.arrayBuffer());
  } else {
    const file = new File(asset.uri);
    if (file.size > MAX_VIDEO_BYTES) throw Error("Choose a video under 20 MB.");
    bytes = await file.bytes();
  }
  const cleaned = sanitizeVideo(bytes),
    base64 = encodeBase64(cleaned.bytes);
  let uri = `data:${cleaned.mime};base64,${base64}`;
  if (Platform.OS !== "web") {
    const file = new File(
      Paths.cache,
      `indraya-${Date.now()}-${Math.random().toString(36).slice(2)}.${cleaned.mime === "video/mp4" ? "mp4" : "mov"}`,
    );
    file.write(cleaned.bytes);
    uri = file.uri;
  }
  return {
    base64,
    uri,
    kind: "video",
    mime: cleaned.mime,
    duration: cleaned.duration,
  };
}
export async function demoAttachmentUri(
  photo: PreparedPhoto,
  id: string,
): Promise<string> {
  if (Platform.OS === "web" || photo.kind !== "video") return photo.uri;
  const dest = new File(
    Paths.document,
    `${id}.${photo.mime === "video/quicktime" ? "mov" : "mp4"}`,
  );
  new File(photo.uri).copy(dest);
  return dest.uri;
}
export function removeDemoAttachment(uri: string) {
  if (Platform.OS !== "web" && uri.startsWith(Paths.document.uri + "local-")) {
    const file = new File(uri);
    if (file.exists) file.delete();
  }
}
export async function pickPhoto(): Promise<PreparedPhoto | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted)
    throw Error("Photo access was declined. You can share without a photo.");
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: false,
    quality: 1,
    exif: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset) throw Error("No photo selected.");
  const context = ImageManipulator.manipulate(asset.uri);
  const width = asset.width,
    height = asset.height;
  if (Math.max(width, height) > 1280)
    context.resize(width >= height ? { width: 1280 } : { height: 1280 });
  const image = await context.renderAsync();
  const saved = await image.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.72,
    base64: true,
  });
  if (!saved.base64) throw Error("Unable to prepare this image.");
  const base64 = encodeBase64(sanitizeJpeg(decodeBase64(saved.base64)));
  return { base64, uri: `data:image/jpeg;base64,${base64}` };
}
