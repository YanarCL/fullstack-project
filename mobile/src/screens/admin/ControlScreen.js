import { useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet, Alert, RefreshControl, TouchableOpacity } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useApiFetch } from "../../AuthContext";
import { Card } from "../../components/Card";
import { Table } from "../../components/Table";
import { useOrientation } from "../../useOrientation";
import { colors, spacing } from "../../theme";

const COLUMNS = [
  { key: "employeeName", label: "Сотрудник" },
  { key: "sizName", label: "СИЗ" },
  { key: "dueAt", label: "Срок сдачи", width: 110 },
  {
    key: "overdueDays",
    label: "Просрочка",
    width: 100,
    render: (row) => (
      <Text style={{ color: colors.danger, fontWeight: "600" }}>{row.overdueDays} дн.</Text>
    ),
  },
];

export default function ControlScreen() {
  const apiFetch = useApiFetch();
  const { isLandscape } = useOrientation();
  const [overdueItems, setOverdueItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/admin/control/overdue");
      setOverdueItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleNotifyAll() {
    try {
      const res = await apiFetch("/admin/control/notify-all", { method: "POST" });
      Alert.alert("Готово", `Уведомления отправлены: ${res.notified}`);
    } catch (err) {
      Alert.alert("Ошибка", err.message);
    }
  }

  return (
    <View style={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}

      {isLandscape ? (
        <Table columns={COLUMNS} rows={overdueItems} emptyText="Просрочек нет" />
      ) : (
        <FlatList
          data={overdueItems}
          keyExtractor={(_, index) => String(index)}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 90 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          ListEmptyComponent={!loading && <Text style={styles.empty}>Просрочек нет</Text>}
          renderItem={({ item }) => (
            <Card
              badge={{
                text: `Просрочено на ${item.overdueDays} дн.`,
                style: { backgroundColor: "#fdecea" },
                textStyle: { color: colors.danger },
              }}
              fields={[
                { label: "Сотрудник", value: item.employeeName },
                { label: "СИЗ", value: item.sizName },
                { label: "Срок сдачи", value: item.dueAt },
              ]}
            />
          )}
        />
      )}

      {overdueItems.length > 0 && (
        <TouchableOpacity style={styles.notifyBtn} onPress={handleNotifyAll}>
          <Text style={styles.notifyBtnText}>Уведомить всех</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  error: { color: colors.danger, padding: spacing.lg },
  empty: { color: colors.textMuted, textAlign: "center", marginTop: spacing.xl },
  notifyBtn: {
    position: "absolute",
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.danger,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  notifyBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
