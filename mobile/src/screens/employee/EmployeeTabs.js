import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SizScreen from "./SizScreen";
import RequestsScreen from "./RequestsScreen";
import NotificationsScreen from "./NotificationsScreen";
import { useAuth } from "../../AuthContext";
import { colors } from "../../theme";

const Tab = createBottomTabNavigator();

const ICONS = {
  "Мои СИЗ": "shirt-outline",
  Запросы: "document-text-outline",
  Уведомления: "notifications-outline",
};

function LogoutButton() {
  const { logout } = useAuth();
  return (
    <TouchableOpacity onPress={logout} style={{ marginRight: 16 }}>
      <Text style={{ color: colors.primary, fontWeight: "600" }}>Выйти</Text>
    </TouchableOpacity>
  );
}

export default function EmployeeTabs() {
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
      <Tab.Screen name="Мои СИЗ" component={SizScreen} />
      <Tab.Screen name="Запросы" component={RequestsScreen} />
      <Tab.Screen name="Уведомления" component={NotificationsScreen} />
    </Tab.Navigator>
  );
}
