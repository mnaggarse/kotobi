import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ConfirmModal from "../components/ConfirmModal";
import { database } from "../lib/database";
// Removed styles import - using fixed values instead

export default function AddBookScreen() {
  const [title, setTitle] = useState("");
  const [cover, setCover] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationModalVisible, setValidationModalVisible] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [validationType, setValidationType] = useState<"warning" | "info">(
    "warning"
  );

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("إذن مطلوب", "يرجى منح الإذن للوصول إلى مكتبة الصور");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [2, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setCover(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("خطأ", "فشل في اختيار الصورة. يرجى المحاولة مرة أخرى.");
    }
  };

  const showValidationError = (
    message: string,
    type: "warning" | "info" = "warning"
  ) => {
    setValidationMessage(message);
    setValidationType(type);
    setValidationModalVisible(true);
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      showValidationError("يرجى إدخال عنوان الكتاب للمتابعة.");
      return;
    }

    if (
      !totalPages.trim() ||
      isNaN(Number(totalPages)) ||
      Number(totalPages) <= 0
    ) {
      showValidationError(
        "يرجى إدخال عدد صحيح من الصفحات (يجب أن يكون أكبر من 0)."
      );
      return;
    }

    if (!cover.trim()) {
      showValidationError("يرجى اختيار صورة غلاف لكتابك.");
      return;
    }

    setIsSubmitting(true);

    try {
      database.addBook({
        title: title.trim(),
        cover: cover.trim(),
        totalPages: Number(totalPages),
        pagesRead: 0,
        rating: 0,
        status: "to-read",
      });

      setTitle("");
      setCover("");
      setTotalPages("");

      router.push({
        pathname: "/",
        params: { refresh: Date.now() },
      });
    } catch (error) {
      console.error("Error adding book:", error);
      showValidationError(
        "فشل في إضافة الكتاب. يرجى المحاولة مرة أخرى.",
        "warning"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>إضافة كتاب</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>صورة الغلاف</Text>
            <TouchableOpacity
              style={styles.imagePickerButton}
              onPress={pickImage}
            >
              {cover ? (
                <Image source={{ uri: cover }} style={styles.selectedImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera" size={32} color="#666666" />
                  <Text style={styles.imagePlaceholderText}>
                    اختر صورة الغلاف
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>عنوان الكتاب</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="أدخل عنوان الكتاب"
                placeholderTextColor="#999999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>إجمالي الصفحات</Text>
              <TextInput
                style={{
                  ...styles.input,
                  direction: "ltr",
                  textAlign: "right",
                }}
                value={totalPages}
                onChangeText={setTotalPages}
                placeholder="أدخل إجمالي عدد الصفحات"
                placeholderTextColor="#999999"
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? "جاري الإضافة..." : "إضافة الكتاب"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Validation Error Modal */}
      <ConfirmModal
        visible={validationModalVisible}
        onClose={() => setValidationModalVisible(false)}
        onConfirm={() => setValidationModalVisible(false)}
        title="معلومات مفقودة"
        message={validationMessage}
        confirmText="حسناً"
        type={validationType}
        icon="alert-circle-outline"
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: 60,
    padding: 20,
  },
  header: {
    alignItems: "center",
    paddingBottom: 24,
  },
  headerTitle: {
    fontFamily: "IBMPlexSansArabic-SemiBold",
    fontSize: 28,
    color: "#1A1A1A",
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontFamily: "IBMPlexSansArabic-SemiBold",
    fontSize: 18,
    color: "#1A1A1A",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    fontFamily: "IBMPlexSansArabic-SemiBold",
  },
  imagePickerButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  selectedImage: {
    width: "100%",
    height: 160,
    resizeMode: "cover",
  },
  imagePlaceholder: {
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  imagePlaceholderText: {
    fontFamily: "IBMPlexSansArabic-Regular",
    fontSize: 18,
    color: "#4A4A4A",
    marginTop: 12,
  },
  submitButton: {
    backgroundColor: "#6147E5",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#8A8A8A",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontFamily: "IBMPlexSansArabic-SemiBold",
    fontSize: 18,
  },
});
