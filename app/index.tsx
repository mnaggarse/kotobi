import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BookCard from "../components/BookCard";
import ConfirmModal from "../components/ConfirmModal";
import { Book, database } from "../lib/database";

export default function LibraryScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [newPagesRead, setNewPagesRead] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [validationModalVisible, setValidationModalVisible] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [bookToEdit, setBookToEdit] = useState<Book | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    totalPages: "",
    status: "to-read" as Book["status"],
    cover: "",
  });
  const [editRating, setEditRating] = useState(0);
  const [pagesWarningModalVisible, setPagesWarningModalVisible] =
    useState(false);
  const [pendingEditData, setPendingEditData] = useState<{
    title: string;
    totalPages: number;
    cover: string;
    rating: number;
  } | null>(null);
  const params = useLocalSearchParams();

  const loadBooks = () => {
    try {
      const allBooks = database.getBooks();
      setBooks(allBooks);
    } catch (error) {
      console.error("Error loading books:", error);
      Alert.alert("خطأ", "فشل في تحميل الكتب");
    }
  };

  useEffect(() => {
    loadBooks();
  }, [refreshTrigger]);

  useEffect(() => {
    if (params.refresh) {
      loadBooks();
    }
  }, [params.refresh]);

  const onRefresh = () => {
    setRefreshing(true);
    loadBooks();
    setRefreshing(false);
  };

  const handleBookPress = (book: Book) => {
    setSelectedBook(book);
    setNewPagesRead(book.pagesRead.toString());
    setProgressModalVisible(true);
  };

  const showValidationError = (message: string) => {
    setValidationMessage(message);
    setValidationModalVisible(true);
  };

  const updateBookProgress = () => {
    if (!selectedBook) return;

    const pagesRead = parseInt(newPagesRead);
    if (isNaN(pagesRead) || pagesRead < 0) {
      showValidationError(
        "يرجى إدخال عدد صحيح من الصفحات (يجب أن يكون 0 أو أكثر)."
      );
      return;
    }

    if (pagesRead > selectedBook.totalPages) {
      showValidationError(
        `لا يمكنك قراءة صفحات أكثر مما يحتويه الكتاب. الكتاب يحتوي على ${selectedBook.totalPages} صفحة.`
      );
      return;
    }

    try {
      let newStatus = selectedBook.status;
      if (pagesRead === 0) {
        newStatus = "to-read";
      } else if (pagesRead === selectedBook.totalPages) {
        newStatus = "completed";
      } else {
        newStatus = "reading";
      }

      database.updateBookProgress(selectedBook.id!, pagesRead, newStatus);
      setProgressModalVisible(false);
      setSelectedBook(null);
      setNewPagesRead("");

      setRefreshTrigger((prev) => prev + 1);
      router.push({
        pathname: "/",
        params: { refresh: Date.now() },
      });
    } catch (error) {
      console.error("Error updating progress:", error);
      Alert.alert("خطأ", "فشل في تحديث التقدم");
    }
  };

  const handleBookLongPress = (book: Book) => {
    setBookToEdit(book);
    setEditForm({
      title: book.title,
      totalPages: book.totalPages.toString(),
      status: book.status,
      cover: book.cover,
    });
    setEditRating(typeof book.rating === "number" ? book.rating : 0);
    setEditModalVisible(true);
  };

  const handleEditBook = () => {
    if (!bookToEdit) return;

    if (!editForm.title.trim()) {
      showValidationError("يرجى إدخال عنوان الكتاب.");
      return;
    }

    if (
      !editForm.totalPages.trim() ||
      isNaN(Number(editForm.totalPages)) ||
      Number(editForm.totalPages) <= 0
    ) {
      showValidationError(
        "يرجى إدخال عدد صحيح من الصفحات (يجب أن يكون أكبر من 0)."
      );
      return;
    }

    if (Number(editForm.totalPages) < bookToEdit.pagesRead) {
      setPagesWarningModalVisible(true);
      setPendingEditData({
        title: editForm.title,
        totalPages: Number(editForm.totalPages),
        cover: editForm.cover,
        rating: editRating,
      });
      return;
    }

    proceedWithEdit();
  };

  const proceedWithEdit = () => {
    if (!bookToEdit) return;

    try {
      const newTotalPages = pendingEditData
        ? pendingEditData.totalPages
        : Number(editForm.totalPages);
      const newTitle = pendingEditData
        ? pendingEditData.title
        : editForm.title.trim();
      const newCover = pendingEditData ? pendingEditData.cover : editForm.cover;
      const newRating = pendingEditData ? pendingEditData.rating : editRating;

      // Reset pages read to 0 if total pages is less than current pages read
      const newPagesRead =
        newTotalPages < bookToEdit.pagesRead ? 0 : bookToEdit.pagesRead;

      let newStatus = editForm.status;
      if (newPagesRead === 0) {
        newStatus = "to-read";
      } else if (newPagesRead === newTotalPages) {
        newStatus = "completed";
      } else {
        newStatus = "reading";
      }

      // Update book details in database
      database.updateBookDetails(
        bookToEdit.id!,
        newTitle,
        newTotalPages,
        newStatus,
        newCover,
        newRating
      );

      // Also update the pages read if it changed
      if (newPagesRead !== bookToEdit.pagesRead) {
        database.updateBookProgress(bookToEdit.id!, newPagesRead, newStatus);
      }

      setEditModalVisible(false);
      setBookToEdit(null);
      setEditForm({
        title: "",
        totalPages: "",
        status: "to-read",
        cover: "",
      });
      setEditRating(0);
      setPagesWarningModalVisible(false);
      setPendingEditData(null);

      setRefreshTrigger((prev) => prev + 1);
      router.push({
        pathname: "/",
        params: { refresh: Date.now() },
      });
    } catch (error) {
      console.error("Error updating book:", error);
      Alert.alert("خطأ", "فشل في تحديث الكتاب");
    }
  };

  const handleDeleteFromEdit = () => {
    if (!bookToEdit) return;

    setBookToDelete(bookToEdit);
    setEditModalVisible(false);
    setBookToEdit(null);
    setEditForm({
      title: "",
      totalPages: "",
      status: "to-read",
      cover: "",
    });
    setDeleteModalVisible(true);
  };

  const pickEditImage = async () => {
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
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setEditForm((prev) => ({ ...prev, cover: result.assets[0].uri }));
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("خطأ", "فشل في اختيار الصورة. يرجى المحاولة مرة أخرى.");
    }
  };

  const handleDeleteBook = () => {
    if (!bookToDelete) return;

    try {
      database.deleteBook(bookToDelete.id!);

      setRefreshTrigger((prev) => prev + 1);
      setDeleteModalVisible(false);
      setBookToDelete(null);

      router.push({
        pathname: "/",
        params: { refresh: Date.now() },
      });
    } catch (error) {
      console.error("Error deleting book:", error);
      Alert.alert("خطأ", "فشل في حذف الكتاب");
    }
  };

  const getBooksByStatus = (status: Book["status"]) => {
    return books.filter((book) => book.status === status);
  };

  const renderBookSection = (
    title: string,
    books: Book[],
    emptyMessage: string
  ) => {
    // Only render section if it has books
    if (books.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.bookGrid}>
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onPress={() => handleBookPress(book)}
              onLongPress={() => handleBookLongPress(book)}
            />
          ))}
        </View>
      </View>
    );
  };

  const renderEmptyLibrary = () => (
    <View style={styles.emptyLibraryContainer}>
      <Ionicons name="library-outline" size={80} color="#CCCCCC" />
      <Text style={styles.emptyLibraryTitle}>مكتبتك فارغة</Text>
      <Text style={styles.emptyLibraryMessage}>
        ابدأ رحلتك في القراءة بإضافة كتاب جديد
      </Text>
    </View>
  );

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
          <Text style={styles.title}>المكتبة</Text>
        </View>
        {books.length === 0 ? (
          renderEmptyLibrary()
        ) : (
          <>
            {renderBookSection(
              "قيد القراءة",
              getBooksByStatus("reading"),
              "لا توجد كتب قيد القراءة"
            )}
            {renderBookSection(
              "للقراءة",
              getBooksByStatus("to-read"),
              "لا توجد كتب للقراءة"
            )}
            {renderBookSection(
              "مكتملة",
              getBooksByStatus("completed"),
              "لا توجد كتب مكتملة"
            )}
          </>
        )}
      </ScrollView>

      {/* Progress Update Modal */}
      <Modal
        visible={progressModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setProgressModalVisible(false)}
        statusBarTranslucent={true}
      >
        <KeyboardAvoidingView
          behavior="padding"
          style={styles.modalOverlay}
          keyboardVerticalOffset={-100}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تحديث التقدم</Text>
              <Text style={styles.modalBookTitle}>{selectedBook?.title}</Text>
            </View>

            <View style={styles.totalPagesInfo}>
              <Text style={styles.totalPagesText}>
                عدد الصفحات: {selectedBook?.totalPages}
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputWithButtons}>
                <TouchableOpacity
                  style={styles.plusButton}
                  onPress={() => {
                    const current = parseInt(newPagesRead) || 0;
                    const max = selectedBook?.totalPages || 0;
                    const newValue = Math.min(max, current + 1);
                    setNewPagesRead(newValue.toString());
                  }}
                >
                  <Ionicons name="add" size={24} color="#666666" />
                </TouchableOpacity>

                <TextInput
                  style={styles.modalInput}
                  value={newPagesRead}
                  onChangeText={setNewPagesRead}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#999999"
                  textAlign="center"
                />
                <TouchableOpacity
                  style={styles.minusButton}
                  onPress={() => {
                    const current = parseInt(newPagesRead) || 0;
                    const newValue = Math.max(0, current - 1);
                    setNewPagesRead(newValue.toString());
                  }}
                >
                  <Ionicons name="remove" size={24} color="#666666" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.updateButton}
                onPress={updateBookProgress}
              >
                <Text style={styles.updateButtonText}>تحديث</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setProgressModalVisible(false);
                  setSelectedBook(null);
                  setNewPagesRead("");
                }}
              >
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Book Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
        statusBarTranslucent={true}
      >
        <KeyboardAvoidingView
          behavior="padding"
          style={styles.modalOverlay}
          keyboardVerticalOffset={-100}
        >
          <View style={styles.modalContent}>
            {/* Floating Delete Button */}
            <TouchableOpacity
              style={styles.floatingDeleteButton}
              onPress={handleDeleteFromEdit}
            >
              <Ionicons name="trash" size={24} color="#F44336" />
            </TouchableOpacity>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تعديل الكتاب</Text>
              <Text style={styles.modalBookTitle}>{bookToEdit?.title}</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>صورة الغلاف:</Text>
              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={pickEditImage}
              >
                {editForm.cover ? (
                  <Image
                    source={{ uri: editForm.cover }}
                    style={styles.selectedImage}
                  />
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

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>عنوان الكتاب:</Text>
              <TextInput
                style={styles.modalTextInput}
                value={editForm.title}
                onChangeText={(text) =>
                  setEditForm((prev) => ({ ...prev, title: text }))
                }
                placeholder="أدخل عنوان الكتاب"
                placeholderTextColor="#999999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>إجمالي الصفحات:</Text>
              <TextInput
                style={styles.modalTextInput}
                value={editForm.totalPages}
                onChangeText={(text) =>
                  setEditForm((prev) => ({ ...prev, totalPages: text }))
                }
                keyboardType="numeric"
                placeholder="أدخل إجمالي الصفحات"
                placeholderTextColor="#999999"
              />
            </View>

            <View style={[styles.inputContainer, styles.inlineLabelRow]}>
              <Text style={[styles.inputLabel, styles.inlineLabel]}>
                التقييم:
              </Text>
              <View style={styles.ratingRow}>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TouchableOpacity key={i} onPress={() => setEditRating(i)}>
                      <Ionicons
                        name={i <= editRating ? "star" : "star-outline"}
                        size={20}
                        color={i <= editRating ? "#F59E0B" : "#C7C7C7"}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity onPress={() => setEditRating(0)}>
                  <Ionicons name="refresh" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.updateButton}
                onPress={handleEditBook}
              >
                <Text style={styles.updateButtonText}>حفظ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setEditModalVisible(false);
                  setBookToEdit(null);
                  setEditForm({
                    title: "",
                    totalPages: "",
                    status: "to-read",
                    cover: "",
                  });
                  setEditRating(0);
                }}
              >
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Book Confirmation Modal */}
      <ConfirmModal
        visible={deleteModalVisible}
        onClose={() => {
          setDeleteModalVisible(false);
          setBookToDelete(null);
        }}
        onConfirm={handleDeleteBook}
        title="حذف الكتاب"
        message={`هل أنت متأكد من حذف "${bookToDelete?.title}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="حذف"
        cancelText="إلغاء"
        type="danger"
        icon="trash-outline"
      />

      {/* Validation Modal */}
      <ConfirmModal
        visible={validationModalVisible}
        onClose={() => setValidationModalVisible(false)}
        onConfirm={() => setValidationModalVisible(false)}
        title="خطأ في التحقق"
        message={validationMessage}
        confirmText="حسناً"
        type="warning"
        icon="warning-outline"
        showCancelButton={false}
      />

      {/* Pages Warning Modal */}
      <ConfirmModal
        visible={pagesWarningModalVisible}
        onClose={() => {
          setPagesWarningModalVisible(false);
          setPendingEditData(null);
        }}
        onConfirm={() => {
          setPagesWarningModalVisible(false);
          setPendingEditData(null);
          proceedWithEdit();
        }}
        title="إعادة تعيين التقدم"
        message={`تحاول تعيين إجمالي الصفحات إلى ${pendingEditData?.totalPages}، لكنك قرأت بالفعل ${bookToEdit?.pagesRead} صفحة. سيؤدي هذا إلى إعادة تعيين تقدم القراءة إلى 0 صفحة.`}
        confirmText="إعادة تعيين التقدم"
        cancelText="إلغاء"
        type="danger"
        icon="warning-outline"
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
  },
  title: {
    fontFamily: "IBMPlexSansArabic-SemiBold",
    fontSize: 28,
    color: "#1A1A1A",
    marginBottom: 8,
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontFamily: "IBMPlexSansArabic-SemiBold",
    fontSize: 24,
    color: "#1A1A1A",
    marginHorizontal: 20,
    marginBottom: 8,
  },
  bookGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    justifyContent: "space-between",
    gap: 12,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    marginHorizontal: 20,
  },
  emptyText: {
    fontFamily: "IBMPlexSansArabic-Regular",
    fontSize: 18,
    color: "#8A8A8A",
    marginTop: 12,
    textAlign: "center",
  },
  emptyLibraryContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
    marginTop: 120,
  },
  emptyLibraryTitle: {
    fontFamily: "IBMPlexSansArabic-SemiBold",
    fontSize: 24,
    color: "#1A1A1A",
    marginTop: 20,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyLibraryMessage: {
    fontFamily: "IBMPlexSansArabic-Regular",
    fontSize: 18,
    color: "#4A4A4A",
    textAlign: "center",
    lineHeight: 24,
  },
  modalOverlay: {
    position: "absolute",
    top: -50,
    left: 0,
    right: 0,
    bottom: -50,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    margin: 24,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 8,
  },
  modalIconContainer: {
    marginBottom: 8,
  },
  modalTitle: {
    fontFamily: "IBMPlexSansArabic-SemiBold",
    fontSize: 22,
    color: "#1A1A1A",
    textAlign: "center",
  },
  modalBookTitle: {
    fontFamily: "IBMPlexSansArabic-Regular",
    fontSize: 18,
    color: "#4A4A4A",
    textAlign: "center",
    marginBottom: 12,
  },
  totalPagesInfo: {
    alignItems: "center",
    marginBottom: 8,
  },
  totalPagesText: {
    fontFamily: "IBMPlexSansArabic-SemiBold",
    fontSize: 18,
    color: "#1A1A1A",
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: "IBMPlexSansArabic-SemiBold",
    fontSize: 18,
    color: "#1A1A1A",
    marginBottom: 4,
  },
  modalInput: {
    flex: 1,
    padding: 16,
    fontSize: 20,
    color: "#1A1A1A",
    textAlign: "center",
    fontFamily: "IBMPlexSansArabic-SemiBold",
  },
  inputWithButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  minusButton: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  plusButton: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  cancelButtonText: {
    fontFamily: "IBMPlexSansArabic-SemiBold",
    fontSize: 16,
    color: "#4A4A4A",
  },
  updateButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#6147E5",
    alignItems: "center",
  },
  updateButtonText: {
    fontFamily: "IBMPlexSansArabic-SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  modalTextInput: {
    padding: 16,
    color: "#1A1A1A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    textAlignVertical: "center",
    fontFamily: "IBMPlexSansArabic-SemiBold",
  },
  ratingRow: {
    width: "79%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  starsRow: {
    flexDirection: "row",
    gap: 8,
  },
  inlineLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inlineLabel: {
    marginBottom: 0,
  },
  deleteButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#FF6B6B",
    alignItems: "center",
  },
  deleteButtonText: {
    fontFamily: "IBMPlexSansArabic-SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  floatingDeleteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  imagePickerButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  imagePlaceholder: {
    height: 140,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  imagePlaceholderText: {
    fontFamily: "IBMPlexSansArabic-Regular",
    fontSize: 14,
    color: "#4A4A4A",
    marginTop: 8,
  },
  selectedImage: {
    width: "100%",
    height: 140,
    resizeMode: "cover",
  },
});
