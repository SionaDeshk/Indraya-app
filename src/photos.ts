import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import {
  decodeBase64,
  encodeBase64,
  sanitizeJpeg,
} from "../supabase/functions/_shared/media";
export type PreparedPhoto = { base64: string; uri: string };
export async function pickPhoto(): Promise<PreparedPhoto | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted)
    throw Error("Photo access was declined. You can submit without a photo.");
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
