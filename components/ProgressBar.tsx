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
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {total}/{current} ({Math.floor(percentage)}%)
        </Text>
      </View>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${percentage}%`,
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
  },
  value: {
    fontFamily: "IBMPlexSansArabic-SemiBold",
    fontSize: 12,
    color: "#4A4A4A",
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
