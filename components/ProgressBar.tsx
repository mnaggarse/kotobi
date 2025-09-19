import { StyleSheet, Text, View } from "react-native";
// Removed styles import - using fixed values instead

interface ProgressBarProps {
  label: string;
  current: number;
  total: number;
  color?: string;
}

export default function ProgressBar({
  label,
  current,
  total,
  color = "#6147E5",
}: ProgressBarProps) {
  const safeTotal = Math.max(0, Number.isFinite(total) ? total : 0);
  const boundedCurrent = Math.min(
    Math.max(0, Number.isFinite(current) ? current : 0),
    safeTotal
  );
  const percentage = safeTotal > 0 ? (boundedCurrent / safeTotal) * 100 : 0;

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label} numberOfLines={1} allowFontScaling={false}>
          {label}
        </Text>
        <Text style={styles.value} numberOfLines={1} allowFontScaling={false}>
          {safeTotal}/{boundedCurrent} ({Math.floor(percentage)}%)
        </Text>
      </View>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(100, Math.max(0, percentage))}%`,
                backgroundColor: color,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  labelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontFamily: "IBMPlexSansArabic-SemiBold",
    fontSize: 14,
    color: "#1A1A1A",
    maxWidth: "60%",
  },
  value: {
    fontFamily: "IBMPlexSansArabic-SemiBold",
    fontSize: 12,
    color: "#4A4A4A",
    maxWidth: "40%",
    textAlign: "left",
  },
  progressContainer: {
    height: 12,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#F3F4F6",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
  },
});
