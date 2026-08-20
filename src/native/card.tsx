import * as React from "react";
import { Text, View, type TextProps, type ViewProps } from "react-native";

import { cn } from "../lib/utils";

function Card({ className, ...props }: ViewProps) {
  return (
    <View className={cn("bg-card gap-4 rounded border border-border p-4", className)} {...props} />
  );
}

function CardHeader({ className, ...props }: ViewProps) {
  return <View className={cn("gap-1", className)} {...props} />;
}

function CardTitle({ className, ...props }: TextProps) {
  return (
    <Text
      accessibilityRole="header"
      className={cn("text-card-foreground text-xl", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: TextProps) {
  return <Text className={cn("text-muted-foreground text-xs", className)} {...props} />;
}

function CardAction({ className, ...props }: ViewProps) {
  return <View className={cn("self-start", className)} {...props} />;
}

function CardContent({ className, ...props }: ViewProps) {
  return <View className={className} {...props} />;
}

function CardFooter({ className, ...props }: ViewProps) {
  return <View className={cn("flex-row items-center", className)} {...props} />;
}

export { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
