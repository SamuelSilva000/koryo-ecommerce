import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Linking, Platform } from "react-native";
import { useCarrinho } from "./CartContext";
import { useAuth } from "./AuthContext";
import { apiFetch } from "./api";
import { mostrarAlerta } from "./AlertaGlobal";

export default function PaymentScreen({ navigation }) {
  const { carrinho, valorTotalEmCentavos, buscarCarrinho } = useCarrinho();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const formatarPreco = (c) => `R$ ${(c / 100).toFixed(2)}`;

  const finalizar = async () => {
    if (!carrinho?.itens?.length) { mostrarAlerta("Carrinho vazio", "Adicione itens antes de pagar."); return; }
    setLoading(true);
    try {
      const res = await apiFetch("/api/payments/mercadopago", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": String(user.id) },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.error?.message || "Falha ao gerar pagamento");

      await buscarCarrinho();

      const url = data.init_point || data.url;
      const mode = data.data?.mode;
      const pedidoId = data.data?.pedidoId;

      if (url && mode === "live") {
        if (Platform.OS === "web") window.open(url, "_blank");
        else await Linking.openURL(url);
        mostrarAlerta(`Pedido #${pedidoId} criado`, "Finalize o pagamento na aba que abriu.");
      } else {
        mostrarAlerta(`Pedido #${pedidoId} registrado`, "Modo mock ativo. Pedido salvo no banco.");
      }
      navigation.navigate("Products");
    } catch (e) {
      mostrarAlerta("Erro no pagamento", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Pagamento</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.summary}>
        <View style={styles.accent} />
        <Text style={styles.sectionTitle}>Resumo</Text>
        {carrinho?.itens?.map((item) => (
          <View key={`${item.produtoId}-${item.tamanho}`} style={styles.itemRow}>
            <Text style={styles.itemName} numberOfLines={2}>{item.nomeProduto} x{item.quantidade} (tam {item.tamanho})</Text>
            <Text style={styles.itemPrice}>{formatarPreco(item.subtotalEmCentavos)}</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatarPreco(valorTotalEmCentavos)}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.mpButton, loading && styles.disabled]} onPress={finalizar} disabled={loading}>
          {loading ? <ActivityIndicator color="#f0f3f8" /> : <Text style={styles.mpText}>Pagar com Mercado Pago</Text>}
        </TouchableOpacity>
        <Text style={styles.note}>
          Ao confirmar, o pedido e registrado, o carrinho e limpo e o checkout do Mercado Pago abre em nova aba.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#1a2331", flexGrow: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 40, marginBottom: 20 },
  back: { fontFamily: "Oswald_600SemiBold", color: "#a3b8d0", fontSize: 13, letterSpacing: 1, textTransform: "uppercase" },
  title: { fontFamily: "Oswald_700Bold", fontSize: 20, color: "#f0f3f8", letterSpacing: 2 },
  summary: { backgroundColor: "#222f42", padding: 20, borderRadius: 8, borderWidth: 1, borderColor: "#2e3d54" },
  accent: { height: 3, backgroundColor: "#5a7fbb", borderRadius: 2, marginBottom: 16, width: 40 },
  sectionTitle: { fontFamily: "Oswald_600SemiBold", fontSize: 15, marginBottom: 12, color: "#f0f3f8", letterSpacing: 1, textTransform: "uppercase" },
  itemRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#2e3d54", gap: 8 },
  itemName: { fontFamily: "Oswald_400Regular", flex: 1, fontSize: 13, color: "#a3b8d0" },
  itemPrice: { fontFamily: "Oswald_600SemiBold", color: "#f0f3f8", fontSize: 13 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 14 },
  totalLabel: { fontFamily: "Oswald_600SemiBold", fontSize: 16, color: "#a3b8d0", letterSpacing: 1 },
  totalValue: { fontFamily: "Oswald_700Bold", fontSize: 22, color: "#f0f3f8" },
  actions: { marginTop: 24 },
  mpButton: { backgroundColor: "#c25b5b", padding: 16, borderRadius: 6, alignItems: "center" },
  disabled: { opacity: 0.6 },
  mpText: { fontFamily: "Oswald_700Bold", color: "#f0f3f8", fontSize: 14, letterSpacing: 2, textTransform: "uppercase" },
  note: { fontFamily: "Oswald_400Regular", fontSize: 11, color: "#7d9cc0", textAlign: "center", marginTop: 12, lineHeight: 18 },
});
