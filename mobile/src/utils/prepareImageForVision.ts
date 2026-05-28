import * as ImageManipulator from "expo-image-manipulator";

const TARGET_WIDTH = 1536;
const JPEG_QUALITY = 0.85;

export interface PreparedImage {
  base64: string;
  uri: string;
}

/**
 * Resize and compress an image so it's suitable for OpenAI Vision.
 * Returns both the base64 (for the API call) and the temporary file uri
 * (so the caller can delete it in a `finally` block).
 */
export async function prepareImageForVision(
  sourceUri: string
): Promise<PreparedImage> {
  const result = await ImageManipulator.manipulateAsync(
    sourceUri,
    [{ resize: { width: TARGET_WIDTH } }],
    {
      compress: JPEG_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    }
  );

  if (!result.base64) {
    throw new Error("Image preprocessing failed (no base64 returned)");
  }

  return { base64: result.base64, uri: result.uri };
}
