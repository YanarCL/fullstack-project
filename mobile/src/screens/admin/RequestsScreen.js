import { useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet, Alert, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useApiFetch } from "../../AuthContext";
import { Card } from "../../components/Card";
import { Table } from "../../components/Table";
import { useOrientation } from "../../useOrientation";
import { colors, spacing } from "../../theme";

const STATUS_LABELS = { pending: "Ожидает", approved: "Одобрено", rejected: "Отклонено" };
const STATUS_COLORS = {
  pending: { bg: "#fff6e0", text: colors.warning },
  approved: { bg: "#e3f3e3", text: colors.success },
  rejected: { bg: "#fdecea", text: colors.danger },
};

const COLUMNS = [
  { key: "id", label: "ID", width: 50 },
  { key: "employeeId", label: "ID сотр.", width: 70 },
  { key: "employeeName", label: "Сотрудник" },
  { key: "shop", label: "Цех" },
  {
    key: "status",
    label: "Статус",
    width: 100,
    render: (row) => {
      const st = STATUS_COLORS[row.status] ?? STATUS_COLORS.pending;
      return <Text style={{ color: st.text, fontWeight: "600" }}>{STATUS_LABELS[row.status] ?? row.status}</Text>;
    },
  },
];

export default function RequestsScreen() {
  const apiFetch = useApiFetch();
  const { isLandscape } = useOrientation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/admin/requests");
      setRequests(data);
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

  async function updateStatus(id, status) {
    try {
      await apiFetch(`/admin/requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      load();
    } catch (err) {
      Alert.alert("Ошибка", err.message);
    }
  }

  const rowActions = (item) =>
    item.status === "pending"
      ? [
          { label: "Одобрить", variant: "primary", onPress: () => updateStatus(item.id, "approved") },
          { label: "Отклонить", variant: "danger", onPress: () => updateStatus(item.id, "rejected") },
        ]
      : [];

  return (
    <View style={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}

      {isLandscape ? (
        <Table columns={COLUMNS} rows={requests} actions={rowActions} emptyText="Запросов нет" />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: spacing.lg }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          ListEmptyComponent={!loading && <Text style={styles.empty}>Запросов нет</Text>}
          renderItem={({ item }) => {
            const st = STATUS_COLORS[item.status] ?? STATUS_COLORS.pending;
            return (
              <Card
                badge={{
                  text: STATUS_LABELS[item.status] ?? item.status,
                  style: { backgroundColor: st.bg },
                  textStyle: { color: st.text },
                }}
                fields={[
                  { label: "ID запроса", value: item.id },
                  { label: "Сотрудник", value: item.employeeName },
                  { label: "Цех", value: item.shop },
                  { label: "Комментарий", value: item.comment },
                ]}
                actions={rowActions(item)}
              />
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  error: { color: colors.danger, padding: spacing.lg },
  empty: { color: colors.textMuted, textAlign: "center", marginTop: spacing.xl },
});
