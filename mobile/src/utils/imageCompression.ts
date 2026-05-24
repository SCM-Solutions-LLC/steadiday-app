import * as ImageManipulator from "expo-image-manipulator";

const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.7;

export async function compressImageBase64(base64: string): Promise<string> {
  const uri = `data:image/jpeg;base64,${base64}`;
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_DIMENSION } }],
    {
      compress: JPEG_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    }
  );
  return result.base64 ?? base64;
}

export async function compressImageUri(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_DIMENSION } }],
    {
      compress: JPEG_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    }
  );
  return result.base64 ?? "";
}
