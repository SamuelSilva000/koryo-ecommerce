import { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { useAuth } from "./AuthContext";
import { apiFetch } from "./api";

const STATUS_CORES = {
  pendente: { bg: "#3a2e1a", text: "#e0b66c", label: "Pendente" },
  processando: { bg: "#1e2c42", text: "#7d9cc0", label: "Processando" },
  preparando: { bg: "#2a3850", text: "#a3b8d0", label: "Preparando" },
  em_rota: { bg: "#1a3340", text: "#7db8b0", label: "Em rota" },
  entregue: { bg: "#1f3a2c", text: "#7dbb90", label: "Entregue" },
  cancelado: { bg: "#3a2028", text: "#c25b5b", label: "Cancelado" },
};

export default function OrdersScreen({ navigation }) {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const carregar = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/orders", { headers: { "x-user-id": String(user.id) } });
      const data = await res.json();
      if (data.success) setPedidos(data.data || []);
    } catch (e) {
      console.error("Erro ao buscar pedidos:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const formatarPreco = (c) => `R$ ${(c / 100).toFixed(2)}`;
  const formatarData = (iso) => { try { return new Date(iso).toLocaleString("pt-BR"); } catch { return iso; } };

  const renderPedido = ({ item }) => {
    const s = STATUS_CORES[item.status] || { bg: "#2e3d54", text: "#a3b8d0", label: item.status };
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.pedidoId}>Pedido #{item.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
            <Text style={[styles.statusText, { color: s.text }]}>{s.label}</Text>
          </View>
        </View>
        <Text style={styles.data}>{formatarData(item.criado_em)}</Text>
        <View style={styles.valorRow}>
          <Text style={styles.valorLabel}>Total</Text>
          <Text style={styles.valor}>{formatarPreco(item.valor_total_em_centavos)}</Text>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>Nenhum pedido ainda</Text>
      <Text style={styles.emptyText}>Suas compras aparecerao aqui.</Text>
      <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.shopBtnText}>Ir as compras</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>Voltar</Text></TouchableOpacity>
        <Text style={styles.title}>Meus Pedidos</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading && pedidos.length === 0 ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#5a7fbb" /></View>
      ) : (
        <FlatList
          data={pedidos}
          renderItem={renderPedido}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); carregar(); }} tintColor="#5a7fbb" />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a2331" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: "#222f42", borderBottomWidth: 2, borderBottomColor: "#c25b5b", marginTop: 40 },
  back: { fontFamily: "Oswald_600SemiBold", color: "#a3b8d0", fontSize: 13, letterSpacing: 1, textTransform: "uppercase" },
  title: { fontFamily: "Oswald_700Bold", fontSize: 18, color: "#f0f3f8", letterSpacing: 2 },
  card: { backgroundColor: "#222f42", borderRadius: 8, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#2e3d54" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  pedidoId: { fontFamily: "Oswald_600SemiBold", fontSize: 15, color: "#f0f3f8", letterSpacing: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  statusText: { fontFamily: "Oswald_600SemiBold", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" },
  data: { fontFamily: "Oswald_400Regular", fontSize: 11, color: "#7d9cc0", marginBottom: 12 },
  valorRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  valorLabel: { fontFamily: "Oswald_400Regular", fontSize: 13, color: "#7d9cc0", letterSpacing: 1, textTransform: "uppercase" },
  valor: { fontFamily: "Oswald_700Bold", fontSize: 18, color: "#f0f3f8" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  emptyTitle: { fontFamily: "Oswald_600SemiBold", fontSize: 20, color: "#f0f3f8", marginBottom: 8 },
  emptyText: { fontFamily: "Oswald_400Regular", fontSize: 13, color: "#7d9cc0", marginBottom: 24, textAlign: "center" },
  shopBtn: { backgroundColor: "#c25b5b", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 4 },
  shopBtnText: { fontFamily: "Oswald_700Bold", color: "#f0f3f8", fontSize: 13, letterSpacing: 1, textTransform: "uppercase" },
});
