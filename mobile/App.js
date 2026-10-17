import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { View, ActivityIndicator } from "react-native";
import { AuthProvider, useAuth } from "./src/AuthContext";
import LoginScreen from "./src/screens/LoginScreen";
import AdminTabs from "./src/screens/admin/AdminTabs";
import EmployeeTabs from "./src/screens/employee/EmployeeTabs";
import { colors } from "./src/theme";

function Root() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) return <LoginScreen />;
  return session.user.role === "admin" ? <AdminTabs /> : <EmployeeTabs />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Root />
      </NavigationContainer>
    </AuthProvider>
  );
}
