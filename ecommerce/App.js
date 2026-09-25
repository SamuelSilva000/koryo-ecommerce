import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthProvider, useAuth } from "./AuthContext";
import { CarrinhoProvider } from "./CartContext";
import { AlertaProvider } from "./AlertaGlobal";
import LoginScreen from "./LoginScreen";
import SignUpScreen from "./SignUpScreen";
import ProductsScreen from "./ProductsScreen";
import CartScreen from "./CartScreen";
import PaymentScreen from "./PaymentScreen";
import AdminProductsScreen from "./AdminProductsScreen";
import AdminUsersScreen from "./AdminUsersScreen";
import AdminOrdersScreen from "./AdminOrdersScreen";
import OrdersScreen from "./OrdersScreen";
import { ActivityIndicator, View } from "react-native";
import { useFonts, Oswald_400Regular, Oswald_600SemiBold, Oswald_700Bold } from "@expo-google-fonts/oswald";

const Stack = createNativeStackNavigator();

function Navigation() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1a2331" }}>
        <ActivityIndicator size="large" color="#5a7fbb" />
      </View>
    );
  }

  const isAdminGeral = user?.tipo === "admin_geral";

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        ) : isAdminGeral ? (
          <>
            <Stack.Screen name="AdminProducts" component={AdminProductsScreen} />
            <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
            <Stack.Screen name="AdminOrders" component={AdminOrdersScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Products" component={ProductsScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="Payment" component={PaymentScreen} />
            <Stack.Screen name="AdminProducts" component={AdminProductsScreen} />
            <Stack.Screen name="Orders" component={OrdersScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Oswald_400Regular,
    Oswald_600SemiBold,
    Oswald_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1a2331" }}>
        <ActivityIndicator size="large" color="#5a7fbb" />
      </View>
    );
  }

  return (
    <AlertaProvider>
      <AuthProvider>
        <CarrinhoProvider>
          <Navigation />
        </CarrinhoProvider>
      </AuthProvider>
    </AlertaProvider>
  );
}
