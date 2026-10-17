import { useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useApiFetch } from "../../AuthContext";
import { Card } from "../../components/Card";
import { Table } from "../../components/Table";
import { useOrientation } from "../../useOrientation";
import { colors, spacing } from "../../theme";

const COLUMNS = [
  {
    key: "date",
    label: "Дата",
    width: 170,
    render: (row) => <Text style={{ fontSize: 13 }}>{new Date(row.date).toLocaleString("ru-RU")}</Text>,
  },
  { key: "name", label: "Название СИЗ" },
];

export default function NotificationsScreen() {
  const apiFetch = useApiFetch();
  const { isLandscape } = useOrientation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/employee/notifications");
      setNotifications(data);
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

  async function handleClear() {
    try {
      await apiFetch("/employee/notifications/clear", { method: "POST" });
      setNotifications([]);
    } catch (err) {
      Alert.alert("Ошибка", err.message);
    }
  }

  return (
    <View style={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}

      {isLandscape ? (
        <Table columns={COLUMNS} rows={notifications} emptyText="Уведомлений нет" />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: spacing.lg }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          ListEmptyComponent={!loading && <Text style={styles.empty}>Уведомлений нет</Text>}
          renderItem={({ item }) => (
            <Card
              fields={[
                { label: "СИЗ", value: item.name },
                { label: "Дата", value: new Date(item.date).toLocaleString("ru-RU") },
              ]}
            />
          )}
        />
      )}

      {notifications.length > 0 && (
        <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
          <Text style={styles.clearBtnText}>Очистить уведомления</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  error: { color: colors.danger, padding: spacing.lg },
  empty: { color: colors.textMuted, textAlign: "center", marginTop: spacing.xl },
  clearBtn: {
    position: "absolute",
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  clearBtnText: { color: colors.text, fontWeight: "600", fontSize: 15 },
});
