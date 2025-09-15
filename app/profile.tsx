import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ConfirmModal from "../components/ConfirmModal";
import ProgressBar from "../components/ProgressBar";
import { database } from "../lib/database";
// Removed styles import - using fixed values instead

interface Statistics {
  totalBooks: number;
  completedBooks: number;
  currentlyReading: number;
  totalPagesRead: number;
  totalPagesGoal: number;
}

export default function ProfileScreen() {
  const [stats, setStats] = useState<Statistics>({
    totalBooks: 0,
    completedBooks: 0,
    currentlyReading: 0,
    totalPagesRead: 0,
    totalPagesGoal: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [importSuccessModalVisible, setImportSuccessModalVisible] =
    useState(false);
  const params = useLocalSearchParams();

  const loadStatistics = () => {
    try {
      const statistics = database.getStatistics();
      setStats(statistics);
    } catch (error) {
      console.error("Error loading statistics:", error);
      Alert.alert("خطأ", "فشل في تحميل الإحصائيات");
    }
  };

  useEffect(() => {
    loadStatistics();
  }, []);

  // Listen for navigation parameters to trigger refresh
  useEffect(() => {
    if (params.refresh) {
      loadStatistics();
    }
  }, [params.refresh]);

  useFocusEffect(
    React.useCallback(() => {
      loadStatistics();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadStatistics();
    setRefreshing(false);
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const fileUri = await database.exportData();
      const isAvailable = await Sharing.isAvailableAsync();

      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/json",
          dialogTitle: "تصدير بيانات القراءة",
        });
      } else {
        Alert.alert(
          "اكتمل التصدير",
          `تم تصدير البيانات بنجاح إلى: ${fileUri}`,
          [{ text: "حسناً" }]
        );
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      Alert.alert("خطأ", "فشل في تصدير البيانات. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async () => {
    setIsImporting(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets[0]) {
        setIsImporting(false);
        return;
      }

      const fileContent = await FileSystem.readAsStringAsync(
        result.assets[0].uri
      );
      await database.importData(fileContent);
      loadStatistics();

      setImportModalVisible(false);
      setImportSuccessModalVisible(true);
    } catch (error) {
      console.error("Error importing data:", error);
      Alert.alert(
        "خطأ",
        error instanceof Error
          ? error.message
          : "فشل في استيراد البيانات. يرجى المحاولة مرة أخرى."
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleResetData = () => {
    try {
      database.resetData();

      loadStatistics();

      setResetModalVisible(false);
      setSuccessMessage(
        "تم إعادة تعيين جميع بيانات القراءة بنجاح. مكتبتك فارغة الآن."
      );
      setSuccessModalVisible(true);
    } catch (error) {
      console.error("Error resetting data:", error);
      Alert.alert("خطأ", "فشل في إعادة تعيين البيانات");
    }
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.userName}>الملف الشخصي</Text>
        </View>

        <View style={styles.goalsCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>إحصائيات القراءة</Text>
          </View>

          <ProgressBar
            label="الكتب المكتملة"
            current={stats.completedBooks}
            total={stats.totalBooks}
          />

          <ProgressBar
            label="الصفحات المقروءة"
            current={stats.totalPagesRead}
            total={stats.totalPagesGoal}
          />
        </View>

        <View style={styles.actionsCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>إدارة البيانات</Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.exportButton]}
              onPress={handleExportData}
              disabled={isExporting}
            >
              <Text style={styles.actionButtonText}>
                {isExporting ? "جاري التصدير..." : "تصدير البيانات"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.importButton]}
              onPress={() => setImportModalVisible(true)}
              disabled={isImporting}
            >
              <Text style={styles.importButtonText}>
                {isImporting ? "جاري الاستيراد..." : "استيراد البيانات"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actionsCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>إعادة تعيين البيانات</Text>
          </View>

          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => setResetModalVisible(true)}
          >
            <Text style={styles.resetButtonText}>حذف البيانات</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Reset Data Confirmation Modal */}
      <ConfirmModal
        visible={resetModalVisible}
        onClose={() => setResetModalVisible(false)}
        onConfirm={handleResetData}
        title="إعادة تعيين جميع البيانات"
        message="هل أنت متأكد من إعادة تعيين جميع بيانات القراءة؟ لا يمكن التراجع عن هذا الإجراء وستحذف جميع كتبك وتقدمك نهائياً."
        confirmText="إعادة تعيين"
        cancelText="إلغاء"
        type="danger"
        icon="warning-outline"
      />

      {/* Import Data Confirmation Modal */}
      <ConfirmModal
        visible={importModalVisible}
        onClose={() => setImportModalVisible(false)}
        onConfirm={handleImportData}
        title="استيراد البيانات"
        message="سيؤدي هذا إلى استبدال جميع بيانات القراءة الحالية بالبيانات المستوردة. هل أنت متأكد من المتابعة؟"
        confirmText="استيراد البيانات"
        cancelText="إلغاء"
        type="warning"
        icon="cloud-download-outline"
      />

      {/* Success Modal */}
      <ConfirmModal
        visible={successModalVisible}
        onClose={() => setSuccessModalVisible(false)}
        onConfirm={() => {
          setSuccessModalVisible(false);
          // Navigate back to library with refresh parameter
          router.push({
            pathname: "/",
            params: { refresh: Date.now() },
          });
        }}
        title="اكتملت إعادة تعيين البيانات"
        message={successMessage}
        confirmText="حسناً"
        type="success"
        icon="checkmark-circle-outline"
        showCancelButton={false}
      />

      <ConfirmModal
        visible={importSuccessModalVisible}
        onClose={() => setImportSuccessModalVisible(false)}
        onConfirm={() => {
          setImportSuccessModalVisible(false);
          router.push({
            pathname: "/",
            params: { refresh: Date.now() },
          });
        }}
        title="اكتمل الاستيراد"
        message="تم استيراد بيانات الكتب بنجاح"
        confirmText="حسناً"
        type="success"
        icon="cloud-download-outline"
        showCancelButton={false}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  contentContainer: {
    paddingTop: 60,
    paddingBottom: 20,
  },
  header: {
    alignItems: "center",
    paddingBottom: 24,
  },
  userName: {
    fontFamily: "IBMPlexSansArabic-SemiBold",
    fontSize: 28,
    color: "#1A1A1A",
    marginBottom: 8,
  },
  goalsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderBottomWidth: 3,
    borderColor: "#E5E7EB",
  },
  actionsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderBottomWidth: 3,
    borderColor: "#E5E7EB",
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: "IBMPlexSansArabic-SemiBold",
    fontSize: 20,
    color: "#1A1A1A",
    marginBottom: 8,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 16,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  exportButton: {
    backgroundColor: "#6147E5",
  },
  importButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#6147E5",
  },
  actionButtonText: {
    fontFamily: "IBMPlexSansArabic-SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  importButtonText: {
    fontFamily: "IBMPlexSansArabic-SemiBold",
    fontSize: 16,
    color: "#6147E5",
  },
  resetButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F44336",
    alignItems: "center",
  },
  resetButtonText: {
    fontFamily: "IBMPlexSansArabic-SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
});
