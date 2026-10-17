import { useEffect, useState } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { colors, spacing } from "../theme";

/**
 * Универсальная форма в модалке.
 * fields: [{ key, label, placeholder?, keyboardType? }]
 * initialValues: { [key]: string } — для режима редактирования
 */
export function FormModal({ visible, title, fields, initialValues, onSubmit, onClose }) {
  const [values, setValues] = useState({});

  useEffect(() => {
    if (visible) {
      const initial = {};
      fields.forEach((f) => {
        initial[f.key] = initialValues?.[f.key] != null ? String(initialValues[f.key]) : "";
      });
      setValues(initial);
    }
  }, [visible]);

  function setField(key, val) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>

          {fields.map((f) => (
            <View key={f.key} style={{ marginBottom: spacing.md }}>
              <Text style={styles.label}>{f.label}</Text>
              <TextInput
                style={styles.input}
                placeholder={f.placeholder}
                value={values[f.key] ?? ""}
                onChangeText={(t) => setField(f.key, t)}
                keyboardType={f.keyboardType ?? "default"}
              />
            </View>
          ))}

          <View style={styles.buttonsRow}>
            <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={onClose}>
              <Text style={styles.btnOutlineText}>Отмена</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={() => onSubmit(values)}
            >
              <Text style={styles.btnPrimaryText}>Сохранить</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.lg,
  },
  title: { fontSize: 17, fontWeight: "700", marginBottom: spacing.lg, color: colors.text },
  label: { fontSize: 13, color: colors.textMuted, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: colors.text,
  },
  buttonsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  btn: { flex: 1, borderRadius: 8, paddingVertical: 10, alignItems: "center" },
  btnOutline: { borderWidth: 1, borderColor: colors.border },
  btnOutlineText: { color: colors.text, fontWeight: "600" },
  btnPrimary: { backgroundColor: colors.primary },
  btnPrimaryText: { color: "#fff", fontWeight: "600" },
});
