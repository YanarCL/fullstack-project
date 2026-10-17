import { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
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

const COLUMNS = [
  { key: "id", label: "ID", width: 50 },
  { key: "name", label: "Название" },
  { key: "type", label: "Тип" },
  { key: "lifespanWeeks", label: "Срок, нед.", width: 90 },
];

export default function SizScreen() {
  const apiFetch = useApiFetch();
  const { isLandscape } = useOrientation();
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState({ visible: false, editing: null });

  const load = useCallback(async (searchValue = "") => {
    setLoading(true);
    setError(null);
    try {
      const qs = searchValue ? `?search=${encodeURIComponent(searchValue)}` : "";
      const data = await apiFetch(`/admin/equipment${qs}`);
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(search);
    }, [])
  );

  function openCreate() {
    setModal({ visible: true, editing: null });
  }
  function openEdit(item) {
    setModal({ visible: true, editing: item });
  }

  async function handleSubmit(values) {
    try {
      const body = JSON.stringify({
        name: values.name,
        type_id: null,
        lifespan_weeks: values.lifespan_weeks ? Number(values.lifespan_weeks) : null,
      });
      if (modal.editing) {
        await apiFetch(`/admin/equipment/${modal.editing.id}`, { method: "PUT", body });
      } else {
        await apiFetch("/admin/equipment", { method: "POST", body });
      }
      setModal({ visible: false, editing: null });
      load(search);
    } catch (err) {
      Alert.alert("Ошибка", err.message);
    }
  }

  function handleDelete(item) {
    Alert.alert("Удалить СИЗ", `Удалить «${item.name}» из каталога?`, [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: async () => {
          try {
            await apiFetch(`/admin/equipment/${item.id}`, { method: "DELETE" });
            load(search);
          } catch (err) {
            Alert.alert("Ошибка", err.message);
          }
        },
      },
    ]);
  }

  const rowActions = (item) => [
    { label: "Редакт.", onPress: () => openEdit(item) },
    { label: "Удалить", variant: "danger", onPress: () => handleDelete(item) },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск по названию"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => load(search)}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={() => load(search)}>
          <Text style={styles.searchBtnText}>Найти</Text>
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {isLandscape ? (
        <Table columns={COLUMNS} rows={items} actions={rowActions} emptyText="Каталог пуст" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 90 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => load(search)} />}
          ListEmptyComponent={!loading && <Text style={styles.empty}>Каталог пуст</Text>}
          renderItem={({ item }) => (
            <Card
              fields={[
                { label: "ID", value: item.id },
                { label: "Тип", value: item.type },
                { label: "Срок эксплуатации, нед.", value: item.lifespanWeeks },
              ]}
              actions={rowActions(item)}
              badge={{ text: item.name, style: { backgroundColor: "#e8ecf3" }, textStyle: { color: colors.primary } }}
            />
          )}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={openCreate}>
        <Text style={styles.fabText}>+ Добавить СИЗ</Text>
      </TouchableOpacity>

      <FormModal
        visible={modal.visible}
        title={modal.editing ? "Редактировать СИЗ" : "Новый СИЗ"}
        fields={[
          { key: "name", label: "Название" },
          { key: "lifespan_weeks", label: "Срок эксплуатации, недель", keyboardType: "numeric" },
        ]}
        initialValues={modal.editing ? { name: modal.editing.name, lifespan_weeks: modal.editing.lifespanWeeks } : null}
        onSubmit={handleSubmit}
        onClose={() => setModal({ visible: false, editing: null })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  searchRow: { flexDirection: "row", gap: spacing.sm, padding: spacing.lg, paddingBottom: 0 },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.card,
  },
  searchBtn: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 16, justifyContent: "center" },
  searchBtnText: { color: "#fff", fontWeight: "600" },
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
