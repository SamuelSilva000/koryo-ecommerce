import { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Modal } from "react-native";
import { useAuth } from "./AuthContext";
import { apiFetch } from "./api";
import { mostrarAlerta } from "./AlertaGlobal";

const STATUS_OPCOES = [
  { valor: "pendente", label: "Pendente", cor: "#e0b66c", bg: "#3a2e1a" },
  { valor: "processando", label: "Processando", cor: "#7d9cc0", bg: "#1e2c42" },
  { valor: "preparando", label: "Preparando", cor: "#a3b8d0", bg: "#2a3850" },
  { valor: "em_rota", label: "Em rota", cor: "#7db8b0", bg: "#1a3340" },
  { valor: "entregue", label: "Entregue", cor: "#7dbb90", bg: "#1f3a2c" },
  { valor: "cancelado", label: "Cancelado", cor: "#c25b5b", bg: "#3a2028" },
];

function infoStatus(s) { return STATUS_OPCOES.find((x) => x.valor === s) || STATUS_OPCOES[0]; }

export default function AdminOrdersScreen({ navigation }) {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalPedido, setModalPedido] = useState(null);

  const carregar = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/orders", { headers: { "x-user-id": String(user.id) } });
      const data = await res.json();
      if (data.success) setPedidos(data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { carregar(); }, []);

  const formatarPreco = (c) => `R$ ${(c / 100).toFixed(2)}`;
  const formatarData = (iso) => { try { return new Date(iso).toLocaleString("pt-BR"); } catch { return iso; } };

  const alterarStatus = async (pedido, novoStatus) => {
    try {
      const res = await apiFetch(`/api/orders/${pedido.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-user-id": String(user.id) },
        body: JSON.stringify({ status: novoStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.error?.message || "Falha");
      await carregar();
      setModalPedido(null);
      mostrarAlerta("Sucesso", `Status alterado para ${novoStatus}`);
    } catch (e) { mostrarAlerta("Erro", e.message); }
  };

  const renderPedido = ({ item }) => {
    const s = infoStatus(item.status);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.pedidoId}>Pedido #{item.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
            <Text style={[styles.statusText, { color: s.cor }]}>{s.label}</Text>
          </View>
        </View>
        <Text style={styles.data}>{formatarData(item.criado_em)}</Text>
        <View style={styles.valorRow}>
          <Text style={styles.valorLabel}>Total</Text>
          <Text style={styles.valor}>{formatarPreco(item.valor_total_em_centavos)}</Text>
        </View>
        <TouchableOpacity style={styles.alterarBtn} onPress={() => setModalPedido(item)}>
          <Text style={styles.alterarText}>Alterar status</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>Voltar</Text></TouchableOpacity>
        <Text style={styles.title}>Todos os Pedidos</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#5a7fbb" /></View>
      ) : (
        <FlatList data={pedidos} renderItem={renderPedido} keyExtractor={(i) => String(i.id)} contentContainerStyle={{ padding: 16 }} ListEmptyComponent={<Text style={styles.empty}>Nenhum pedido registrado.</Text>} />
      )}

      <Modal visible={!!modalPedido} transparent animationType="fade" onRequestClose={() => setModalPedido(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.accent} />
            <Text style={styles.modalTitle}>Alterar status</Text>
            {modalPedido && <Text style={styles.modalSubtitle}>Pedido #{modalPedido.id}</Text>}
            <View style={styles.opcoes}>
              {STATUS_OPCOES.map((s) => {
                const atual = modalPedido?.status === s.valor;
                return (
                  <TouchableOpacity key={s.valor} style={[styles.opcao, atual && styles.opcaoAtual]} onPress={() => alterarStatus(modalPedido, s.valor)}>
                    <View style={[styles.dot, { backgroundColor: s.bg, borderColor: s.cor, borderWidth: 2 }]} />
                    <Text style={[styles.opcaoText, atual && styles.opcaoTextAtual]}>{s.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={styles.cancelarBtn} onPress={() => setModalPedido(null)}>
              <Text style={styles.cancelarText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a2331" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: "#222f42", marginTop: 40, borderBottomWidth: 2, borderBottomColor: "#c25b5b" },
  back: { fontFamily: "Oswald_600SemiBold", color: "#a3b8d0", fontSize: 13, letterSpacing: 1, textTransform: "uppercase" },
  title: { fontFamily: "Oswald_700Bold", fontSize: 18, color: "#f0f3f8", letterSpacing: 2 },
  card: { backgroundColor: "#222f42", borderRadius: 8, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#2e3d54" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  pedidoId: { fontFamily: "Oswald_600SemiBold", fontSize: 15, color: "#f0f3f8", letterSpacing: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  statusText: { fontFamily: "Oswald_600SemiBold", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" },
  data: { fontFamily: "Oswald_400Regular", fontSize: 11, color: "#7d9cc0", marginBottom: 12 },
  valorRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  valorLabel: { fontFamily: "Oswald_400Regular", fontSize: 13, color: "#7d9cc0", letterSpacing: 1, textTransform: "uppercase" },
  valor: { fontFamily: "Oswald_700Bold", fontSize: 18, color: "#f0f3f8" },
  alterarBtn: { backgroundColor: "#c25b5b", padding: 12, borderRadius: 4, alignItems: "center" },
  alterarText: { fontFamily: "Oswald_700Bold", color: "#f0f3f8", fontSize: 12, letterSpacing: 2, textTransform: "uppercase" },
  empty: { fontFamily: "Oswald_400Regular", textAlign: "center", color: "#7d9cc0", marginTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(10,20,40,0.75)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalBox: { backgroundColor: "#222f42", borderRadius: 8, padding: 24, width: "100%", maxWidth: 400, borderWidth: 1, borderColor: "#2e3d54" },
  accent: { height: 3, backgroundColor: "#c25b5b", borderRadius: 2, marginBottom: 16, width: 40 },
  modalTitle: { fontFamily: "Oswald_600SemiBold", fontSize: 18, color: "#f0f3f8", marginBottom: 6, letterSpacing: 1 },
  modalSubtitle: { fontFamily: "Oswald_400Regular", fontSize: 13, color: "#7d9cc0", marginBottom: 20 },
  opcoes: { gap: 8, marginBottom: 16 },
  opcao: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 14, borderRadius: 4, borderWidth: 1, borderColor: "#2e3d54", backgroundColor: "#1a2331" },
  opcaoAtual: { borderColor: "#c25b5b", backgroundColor: "#2a3850" },
  dot: { width: 14, height: 14, borderRadius: 7, marginRight: 12 },
  opcaoText: { fontFamily: "Oswald_600SemiBold", fontSize: 13, color: "#a3b8d0", letterSpacing: 1 },
  opcaoTextAtual: { color: "#f0f3f8" },
  cancelarBtn: { padding: 14, alignItems: "center" },
  cancelarText: { fontFamily: "Oswald_600SemiBold", color: "#7d9cc0", fontSize: 13, letterSpacing: 1 },
});
