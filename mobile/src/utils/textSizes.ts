import { TextSize } from "../types/app";

// Text size options for settings UI
export const TEXT_SIZE_OPTIONS = [
  { id: "normal" as TextSize, name: "Normal", preview: 16 },
  { id: "large" as TextSize, name: "Large", preview: 18 },
  { id: "extra-large" as TextSize, name: "Extra Large", preview: 22 },
];

export const getTextSizeClasses = (size: TextSize) => {
  switch (size) {
    case "normal":
      return {
        largeTitle: "text-2xl font-bold", // 24pt - larger header
        body: "text-base", // 16pt - system default
        title: "text-xl font-bold", // 20pt
        subtitle: "text-lg font-semibold", // 18pt
        button: "text-base font-semibold", // 16pt
        small: "text-sm", // 14pt
      };
    case "large":
      return {
        largeTitle: "text-3xl font-bold", // 30pt
        body: "text-lg", // 18pt
        title: "text-2xl font-bold", // 24pt
        subtitle: "text-xl font-semibold", // 20pt
        button: "text-lg font-semibold", // 18pt
        small: "text-base", // 16pt
      };
    case "extra-large":
      return {
        largeTitle: "text-4xl font-bold", // 36pt
        body: "text-xl", // 20pt
        title: "text-3xl font-bold", // 30pt
        subtitle: "text-2xl font-semibold", // 24pt
        button: "text-xl font-semibold", // 20pt
        small: "text-lg", // 18pt
      };
  }
};

export const getTextSizeValue = (size: TextSize): number => {
  switch (size) {
    case "normal":
      return 16;
    case "large":
      return 18;
    case "extra-large":
      return 20;
  }
};
