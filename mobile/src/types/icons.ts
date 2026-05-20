import { Ionicons } from "@expo/vector-icons";

// Proper type for Ionicons icon names
export type IoniconsName = keyof typeof Ionicons.glyphMap;

// Helper function to validate and cast icon names
export function asIoniconsName(icon: string): IoniconsName {
  return icon as IoniconsName;
}
