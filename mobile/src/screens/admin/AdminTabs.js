import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SizScreen from "./SizScreen";
import RequestsScreen from "./RequestsScreen";
import AddSizScreen from "./AddSizScreen";
import ControlScreen from "./ControlScreen";
import { useAuth } from "../../AuthContext";
import { colors } from "../../theme";

const Tab = createBottomTabNavigator();

const ICONS = {
  Каталог: "file-tray-stacked-outline",
  Запросы: "document-text-outline",
  Выдача: "hand-left-outline",
  Контроль: "alert-circle-outline",
};

function LogoutButton() {
  const { logout } = useAuth();
  return (
    <TouchableOpacity onPress={logout} style={{ marginRight: 16 }}>
      <Text style={{ color: colors.primary, fontWeight: "600" }}>Выйти</Text>
    </TouchableOpacity>
  );
}

export default function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerRight: () => <LogoutButton />,
        tabBarActiveTintColor: colors.primary,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Каталог" component={SizScreen} />
      <Tab.Screen name="Запросы" component={RequestsScreen} />
      <Tab.Screen name="Выдача" component={AddSizScreen} />
      <Tab.Screen name="Контроль" component={ControlScreen} />
    </Tab.Navigator>
  );
}
