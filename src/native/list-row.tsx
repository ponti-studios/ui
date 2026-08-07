import type { ReactNode } from "react";
import { Pressable, type StyleProp, Text, type TextStyle, View } from "react-native";
import { useCSSVariable } from "uniwind";

interface ListRowProps {
  accessibilityLabel: string;
  actionTestID?: string;
  eyebrow?: string;
  leading?: ReactNode;
  onLongPress?: () => void;
  onPress: () => void;
  subtitle?: string | null;
  testID?: string;
  title: string;
  titleStyle?: StyleProp<TextStyle>;
  trailing?: ReactNode;
}

function ListRow({
  accessibilityLabel,
  actionTestID,
  eyebrow,
  leading,
  onLongPress,
  onPress,
  subtitle,
  testID,
  title,
  titleStyle,
  trailing,
}: ListRowProps) {
  const [muted] = useCSSVariable(["--color-muted"]) as string[];

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onLongPress={onLongPress}
      onPress={onPress}
      className="flex-row items-center gap-3 min-h-14 border-b border-border px-4 py-2"
      style={({ pressed }) => pressed && { backgroundColor: muted }}
      testID={testID ?? actionTestID}
    >
      {leading ? <View className="items-center justify-center w-6">{leading}</View> : null}
      <View className="flex-1 gap-0.5 min-w-0">
        {eyebrow ? (
          <Text className="text-caption2 text-muted-foreground tracking-[0.2]">{eyebrow}</Text>
        ) : null}
        <Text numberOfLines={2} className="text-body text-foreground" style={titleStyle}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            ellipsizeMode="tail"
            numberOfLines={1}
            className="text-caption1 text-muted-foreground"
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ? <View className="items-center justify-center">{trailing}</View> : null}
    </Pressable>
  );
}

export { ListRow };
