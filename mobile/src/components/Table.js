import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { colors, spacing } from "../theme";

/**
 * columns: [{ key, label, width?, render?(row) }]
 * rows: массив объектов данных
 * actions?: (row) => [{ label, onPress, variant }]
 */
export function Table({ columns, rows, actions, emptyText = "Нет данных" }) {
  return (
    <ScrollView horizontal contentContainerStyle={{ minWidth: "100%" }}>
      <View>
        <View style={[styles.row, styles.headerRow]}>
          {columns.map((col) => (
            <View key={col.key} style={[styles.cell, { width: col.width ?? 130 }]}>
              <Text style={styles.headerText}>{col.label}</Text>
            </View>
          ))}
          {actions && (
            <View style={[styles.cell, { width: 190 }]}>
              <Text style={styles.headerText}>Действие</Text>
            </View>
          )}
        </View>

        {rows.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>{emptyText}</Text>
          </View>
        ) : (
          rows.map((row, idx) => (
            <View key={row.id ?? idx} style={[styles.row, idx % 2 === 1 && styles.rowAlt]}>
              {columns.map((col) => (
                <View key={col.key} style={[styles.cell, { width: col.width ?? 130 }]}>
                  {col.render ? (
                    col.render(row)
                  ) : (
                    <Text style={styles.cellText} numberOfLines={2}>
                      {row[col.key] ?? "—"}
                    </Text>
                  )}
                </View>
              ))}
              {actions && (
                <View style={[styles.cell, styles.actionsCell, { width: 190 }]}>
                  {actions(row).map((a) => (
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
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: "center",
  },
  headerRow: { backgroundColor: "#f0f0f0" },
  rowAlt: { backgroundColor: "#fafafa" },
  cell: { paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, justifyContent: "center" },
  headerText: { fontWeight: "700", fontSize: 12, color: colors.textMuted },
  cellText: { fontSize: 13, color: colors.text },
  emptyRow: { padding: spacing.lg },
  emptyText: { color: colors.textMuted },
  actionsCell: { flexDirection: "row", gap: 6 },
  actionBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  actionDanger: { backgroundColor: colors.danger, borderColor: colors.danger },
  actionText: { fontSize: 12, fontWeight: "600", color: colors.text },
  actionTextLight: { color: "#fff" },
});
