import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Book } from "../lib/database";
// Removed styles import - using fixed values instead

interface BookCardProps {
  book: Book;
  onPress?: () => void;
  onLongPress?: () => void;
}

export default function BookCard({
  book,
  onPress,
  onLongPress,
}: BookCardProps) {
  const progressPercentage =
    book.totalPages > 0 ? (book.pagesRead / book.totalPages) * 100 : 0;

  const progressColor =
    book.status === "completed"
      ? "#4CAF50"
      : book.status === "reading"
      ? "#6147E5"
      : "#F3F4F6";

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: book.cover }}
        style={styles.cover}
        resizeMode="cover"
      />

      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={3}>
          {book.title}
        </Text>

        <View style={styles.bottomSection}>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingText}>التقييم:</Text>
            {[1, 2, 3, 4, 5].map((i) => (
              <Ionicons
                key={i}
                name={i <= (book.rating || 0) ? "star" : "star-outline"}
                size={18}
                color={i <= (book.rating || 0) ? "#F59E0B" : "#C7C7C7"}
              />
            ))}
          </View>

          <View style={styles.progressRow}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progressPercentage}%`,
                    backgroundColor: progressColor,
                  },
                ]}
              />
            </View>
            <Text style={styles.percentageText}>
              {Math.floor(progressPercentage)}%
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    paddingVertical: 8,
    width: "100%",
    borderWidth: 1,
    borderBottomWidth: 3,
    borderColor: "#E5E7EB",
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  cover: {
    width: 88,
    height: 130,
    borderRadius: 8,
  },
  infoContainer: {
    flex: 1,
    justifyContent: "space-between",
    height: 138,
  },
  title: {
    fontFamily: "IBMPlexSansArabic-SemiBold",
    fontSize: 18,
    paddingTop: 4,
    color: "#1A1A1A",
    lineHeight: 24,
  },
  bottomSection: {
    marginTop: "auto",
  },
  ratingText: {
    fontFamily: "IBMPlexSansArabic-Regular",
    fontSize: 16,
    color: "#1A1A1A",
    textAlign: "left",
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 2,
  },
  progressBar: {
    flex: 1,
    height: 14,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 10,
  },
  percentageText: {
    fontFamily: "IBMPlexSansArabic-SemiBold",
    fontSize: 14,
    paddingTop: 3,
    color: "#4A4A4A",
  },
});
