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
      <View style={styles.coverContainer}>
        <Image
          source={{ uri: book.cover }}
          style={styles.cover}
          resizeMode="cover"
        />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.title}>{book.title}</Text>

        <View style={styles.progressContainer}>
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
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 8,
    marginBottom: 8,
    width: "100%",
    borderWidth: 1,
    borderBottomWidth: 3,
    borderColor: "#E5E7EB",
  },
  coverContainer: {
    position: "relative",
    marginBottom: 8,
  },
  cover: {
    width: "100%",
    height: 220,
    borderRadius: 12,
  },
  infoContainer: {
    flex: 1,
  },
  title: {
    fontFamily: "IBMPlexSansArabic-SemiBold",
    fontSize: 16,
    textAlign: "center",
    color: "#1A1A1A",
    marginBottom: 8,
    lineHeight: 22,
  },
  progressContainer: {
    marginTop: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
  },
  percentageText: {
    fontFamily: "IBMPlexSansArabic-SemiBold",
    fontSize: 14,
    color: "#4A4A4A",
    textAlign: "right",
  },
});
