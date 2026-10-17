import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors, spacing } from "../theme";

/**
 * Карточка-строка данных. fields: [{label, value}]. actions: [{label, onPress, variant}]
 * variant: 'primary' | 'danger' | 'outline' (по умолчанию outline)
 */
export function Card({ fields, actions, badge }) {
  return (
    <View style={styles.card}>
      {badge && (
        <View style={[styles.badge, badge.style]}>
          <Text style={[styles.badgeText, badge.textStyle]}>{badge.text}</Text>
        </View>
      )}
      {fields.map((f) => (
        <View key={f.label} style={styles.row}>
          <Text style={styles.label}>{f.label}</Text>
          <Text style={styles.value}>{f.value ?? "—"}</Text>
        </View>
      ))}
      {actions && actions.length > 0 && (
        <View style={styles.actionsRow}>
          {actions.map((a) => (
            <TouchableOpacity
              key={a.label}
              onPress={a.onPress}
              style={[
                styles.actionBtn,
                a.variant === "primary" && styles.actionPrimary,
                a.variant === "danger" && styles.actionDanger,
              ]}
            >
              <Text
                style={[
                  styles.actionText,
                  (a.variant === "primary" || a.variant === "danger") &&
                    styles.actionTextLight,
                ]}
              >
                {a.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: { color: colors.textMuted, fontSize: 13 },
  value: { color: colors.text, fontSize: 14, fontWeight: "500", flexShrink: 1, textAlign: "right" },
  badge: {
    alignSelf: "flex-start",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "#eee",
    marginBottom: spacing.sm,
  },
  badgeText: { fontSize: 12, fontWeight: "600" },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  actionPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  actionDanger: { backgroundColor: colors.danger, borderColor: colors.danger },
  actionText: { color: colors.text, fontSize: 13, fontWeight: "600" },
  actionTextLight: { color: "#fff" },
});
