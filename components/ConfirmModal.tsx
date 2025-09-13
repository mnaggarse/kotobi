import { Ionicons } from "@expo/vector-icons";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
// Removed styles import - using fixed values instead

interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info" | "success";
  icon?: keyof typeof Ionicons.glyphMap;
  showCancelButton?: boolean;
}

export default function ConfirmModal({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText = "إلغاء",
  type = "info",
  icon,
  showCancelButton = true,
}: ConfirmModalProps) {
  const typeStyles = {
    danger: {
      iconColor: "#F44336",
      confirmButtonColor: "#F44336",
      iconBackground: "#FFEBEE",
    },
    warning: {
      iconColor: "#FF9800",
      confirmButtonColor: "#FF9800",
      iconBackground: "#FFF3E0",
    },
    success: {
      iconColor: "#4CAF50",
      confirmButtonColor: "#4CAF50",
      iconBackground: "#E8F5E8",
    },
    info: {
      iconColor: "#6147E5",
      confirmButtonColor: "#6147E5",
      iconBackground: "#EFF6FF",
    },
  }[type];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.content}>
            {icon && (
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: typeStyles.iconBackground },
                ]}
              >
                <Ionicons name={icon} size={32} color={typeStyles.iconColor} />
              </View>
            )}

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  { backgroundColor: typeStyles.confirmButtonColor },
                  !showCancelButton && styles.fullWidthButton,
                ]}
                onPress={onConfirm}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmButtonText}>{confirmText}</Text>
              </TouchableOpacity>
              {showCancelButton && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>{cancelText}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: -50, // Extend beyond status bar
    left: 0,
    right: 0,
    bottom: -50, // Extend beyond navigation bar
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    margin: 24,
    maxWidth: 400,
    width: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  content: {
    padding: 28,
    alignItems: "center",
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 9999,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontFamily: "IBMPlexSansArabic-SemiBold",
    fontSize: 24,
    color: "#1A1A1A",
    marginBottom: 16,
    textAlign: "center",
  },
  message: {
    fontFamily: "IBMPlexSansArabic-Regular",
    fontSize: 18,
    color: "#4A4A4A",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 28,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
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
  confirmButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmButtonText: {
    fontFamily: "IBMPlexSansArabic-SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  fullWidthButton: {
    flex: 1,
  },
});
