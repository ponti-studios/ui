import type { ReactNode } from "react";
import { Pressable } from "react-native";
import { useCSSVariable } from "uniwind";

interface IconButtonProps {
  accessibilityLabel?: string;
  children: ReactNode;
  disabled?: boolean;
  onPress?: () => void;
  testID?: string;
  variant?: "bordered" | "plain";
}

export function IconButton({
  accessibilityLabel,
  children,
  disabled = false,
  onPress,
  testID,
  variant = "bordered",
}: IconButtonProps) {
  const [border] = useCSSVariable(["--color-border"]) as string[];

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      className={`w-8 h-8 rounded-full border items-center justify-center ${variant === "plain" ? "border-0" : ""}`}
      style={({ pressed }) => [
        { borderColor: variant === "plain" ? "transparent" : border },
        pressed && { opacity: 0.7 },
        disabled && { opacity: 0.4 },
      ]}
    >
      {children}
    </Pressable>
  );
}
