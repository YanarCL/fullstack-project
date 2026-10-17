import { useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet, Alert, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useApiFetch } from "../../AuthContext";
import { Card } from "../../components/Card";
import { Table } from "../../components/Table";
import { useOrientation } from "../../useOrientation";
import { colors, spacing } from "../../theme";

const COLUMNS = [
  { key: "id", label: "ID", width: 50 },
  { key: "name", label: "Название" },
  { key: "type", label: "Тип" },
  { key: "receivedAt", label: "Получено" },
  { key: "dueAt", label: "Срок сдачи" },
  {
    key: "returned",
    label: "Сдано",
    render: (row) => (
      <Text style={{ color: row.returned ? colors.success : colors.danger, fontWeight: "600" }}>
        {row.returned ? "Да" : "Нет"}
      </Text>
    ),
  },
];

export default function SizScreen() {
  const apiFetch = useApiFetch();
  const { isLandscape } = useOrientation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/employee/siz");
      setItems(data);
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

  async function handleReturn(id) {
    Alert.alert("Сдать СИЗ", "Отметить этот СИЗ как сданный?", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Сдать",
        onPress: async () => {
          try {
            await apiFetch(`/employee/siz/${id}/return`, { method: "POST" });
            load();
          } catch (err) {
            Alert.alert("Ошибка", err.message);
          }
        },
      },
    ]);
  }

  if (isLandscape) {
    return (
      <View style={styles.container}>
        {error && <Text style={styles.error}>{error}</Text>}
        <Table
          columns={COLUMNS}
          rows={items}
          actions={(row) =>
            row.returned ? [] : [{ label: "Сдать", variant: "primary", onPress: () => handleReturn(row.id) }]
          }
          emptyText="Нет выданных СИЗ"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: spacing.lg }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={!loading && <Text style={styles.empty}>Нет выданных СИЗ</Text>}
        renderItem={({ item }) => (
          <Card
            badge={{
              text: item.returned ? "Сдано" : "На руках",
              style: { backgroundColor: item.returned ? "#e3f3e3" : "#fdecea" },
              textStyle: { color: item.returned ? colors.success : colors.danger },
            }}
            fields={[
              { label: "Название", value: item.name },
              { label: "Тип", value: item.type },
              { label: "Дата получения", value: item.receivedAt },
              { label: "Срок сдачи", value: item.dueAt },
            ]}
            actions={
              !item.returned
                ? [{ label: "Сдать", variant: "primary", onPress: () => handleReturn(item.id) }]
                : []
            }
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  error: { color: colors.danger, padding: spacing.lg },
  empty: { color: colors.textMuted, textAlign: "center", marginTop: spacing.xl },
});
