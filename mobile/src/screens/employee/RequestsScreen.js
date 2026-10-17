import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useApiFetch } from "../../AuthContext";
import { Card } from "../../components/Card";
import { Table } from "../../components/Table";
import { FormModal } from "../../components/FormModal";
import { useOrientation } from "../../useOrientation";
import { colors, spacing } from "../../theme";

const STATUS_LABELS = { pending: "Ожидает", approved: "Одобрено", rejected: "Отклонено" };
const STATUS_COLORS = {
  pending: { bg: "#fff6e0", text: colors.warning },
  approved: { bg: "#e3f3e3", text: colors.success },
  rejected: { bg: "#fdecea", text: colors.danger },
};

const COLUMNS = [
  { key: "id", label: "ID", width: 60 },
  {
    key: "date",
    label: "Дата",
    width: 160,
    render: (row) => <Text style={{ fontSize: 13 }}>{new Date(row.date).toLocaleString("ru-RU")}</Text>,
  },
  {
    key: "status",
    label: "Статус",
    width: 110,
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
  const [modalVisible, setModalVisible] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/employee/requests");
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

  async function handleCreate(values) {
    try {
      await apiFetch("/employee/requests", {
        method: "POST",
        body: JSON.stringify({ comment: values.comment || null }),
      });
      setModalVisible(false);
      load();
    } catch (err) {
      Alert.alert("Ошибка", err.message);
    }
  }

  return (
    <View style={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}

      {isLandscape ? (
        <Table columns={COLUMNS} rows={requests} emptyText="Запросов пока нет" />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: spacing.lg }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          ListEmptyComponent={!loading && <Text style={styles.empty}>Запросов пока нет</Text>}
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
                  { label: "Дата", value: new Date(item.date).toLocaleString("ru-RU") },
                ]}
              />
            );
          }}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+ Запросить СИЗ</Text>
      </TouchableOpacity>

      <FormModal
        visible={modalVisible}
        title="Новый запрос на СИЗ"
        fields={[{ key: "comment", label: "Комментарий (необязательно)" }]}
        onSubmit={handleCreate}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  error: { color: colors.danger, padding: spacing.lg },
  empty: { color: colors.textMuted, textAlign: "center", marginTop: spacing.xl },
  fab: {
    position: "absolute",
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  fabText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
