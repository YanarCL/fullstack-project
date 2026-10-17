import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useApiFetch } from "../../AuthContext";
import { Card } from "../../components/Card";
import { Table } from "../../components/Table";
import { FormModal } from "../../components/FormModal";
import { useOrientation } from "../../useOrientation";
import { colors, spacing } from "../../theme";

const COLUMNS = [
  { key: "name", label: "Название" },
  { key: "receivedAt", label: "Получено", width: 110 },
  { key: "dueAt", label: "Срок сдачи", width: 110 },
];

export default function AddSizScreen() {
  const apiFetch = useApiFetch();
  const { isLandscape } = useOrientation();
  const [search, setSearch] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null); // { id, name }
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  async function handleSearch() {
    setError(null);
    try {
      const results = await apiFetch(`/admin/employees/search?q=${encodeURIComponent(search)}`);
      setCandidates(results);
      if (results.length === 1) {
        await selectEmployee(results[0]);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function selectEmployee(emp) {
    setSelectedEmployee(emp);
    setCandidates([]);
    try {
      const siz = await apiFetch(`/admin/employees/${emp.id}/siz`);
      setItems(siz);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAssign(values) {
    if (!selectedEmployee) return;
    try {
      await apiFetch(`/admin/employees/${selectedEmployee.id}/siz`, {
        method: "POST",
        body: JSON.stringify({
          equipment_id: Number(values.equipment_id),
          due_at: values.due_at || null,
        }),
      });
      setModalVisible(false);
      selectEmployee(selectedEmployee);
    } catch (err) {
      Alert.alert("Ошибка", err.message);
    }
  }

  function handleDelete(item) {
    Alert.alert("Удалить выдачу", `Удалить «${item.name}» у сотрудника?`, [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: async () => {
          try {
            await apiFetch(`/admin/inventory/${item.id}`, { method: "DELETE" });
            selectEmployee(selectedEmployee);
          } catch (err) {
            Alert.alert("Ошибка", err.message);
          }
        },
      },
    ]);
  }

  const rowActions = (item) => [{ label: "Удалить", variant: "danger", onPress: () => handleDelete(item) }];

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Имя или логин сотрудника"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>Найти</Text>
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {selectedEmployee && (
        <Text style={styles.selected}>Выбран: {selectedEmployee.name}</Text>
      )}

      {candidates.length > 1 && (
        <View style={styles.candidatesBox}>
          {candidates.map((c) => (
            <TouchableOpacity key={c.id} style={styles.candidateRow} onPress={() => selectEmployee(c)}>
              <Text>{c.name} ({c.login})</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {isLandscape ? (
        <Table
          columns={COLUMNS}
          rows={items}
          actions={rowActions}
          emptyText={selectedEmployee ? "У сотрудника нет выданных СИЗ" : "Сначала найдите сотрудника"}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 90 }}
          ListEmptyComponent={
            selectedEmployee ? <Text style={styles.empty}>У сотрудника нет выданных СИЗ</Text> : null
          }
          renderItem={({ item }) => (
            <Card
              fields={[
                { label: "Название", value: item.name },
                { label: "Дата получения", value: item.receivedAt },
                { label: "Срок сдачи", value: item.dueAt },
              ]}
              actions={rowActions(item)}
            />
          )}
        />
      )}

      {selectedEmployee && (
        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
          <Text style={styles.fabText}>+ Выдать СИЗ</Text>
        </TouchableOpacity>
      )}

      <FormModal
        visible={modalVisible}
        title={`Выдать СИЗ: ${selectedEmployee?.name ?? ""}`}
        fields={[
          { key: "equipment_id", label: "ID СИЗ из каталога", keyboardType: "numeric" },
          { key: "due_at", label: "Срок сдачи (ГГГГ-ММ-ДД), необязательно" },
        ]}
        onSubmit={handleAssign}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  searchRow: { flexDirection: "row", gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.sm },
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
  selected: { paddingHorizontal: spacing.lg, color: colors.text, fontWeight: "600" },
  candidatesBox: {
    marginHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.card,
    marginTop: spacing.sm,
  },
  candidateRow: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
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
