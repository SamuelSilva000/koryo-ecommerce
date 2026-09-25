import { useState } from "react";
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useCarrinho } from "./CartContext";
import { useAuth } from "./AuthContext";
import { mostrarAlerta, confirmarAlerta } from "./AlertaGlobal";

export default function CartScreen({ navigation }) {
  const { carrinho, loading, valorTotalEmCentavos, removerDoCarrinho, atualizarItemCarrinho, limparCarrinho } = useCarrinho();
  const [updating, setUpdating] = useState({});

  const formatarPreco = (c) => `R$ ${(c / 100).toFixed(2)}`;
  const chaveItem = (item) => `${item.produtoId}-${item.tamanho}`;

  const handleUpdate = async (item, quantidade) => {
    if (quantidade < 1) { handleRemove(item); return; }
    setUpdating((p) => ({ ...p, [chaveItem(item)]: true }));
    const r = await atualizarItemCarrinho(item.produtoId, quantidade, item.tamanho);
    setUpdating((p) => ({ ...p, [chaveItem(item)]: false }));
    if (!r.success) mostrarAlerta("Erro", r.error);
  };

  const handleRemove = async (item) => {
    const ok = await confirmarAlerta("Remover", `Remover ${item.nomeProduto} (tam ${item.tamanho})?`);
    if (!ok) return;
    setUpdating((p) => ({ ...p, [chaveItem(item)]: true }));
    const r = await removerDoCarrinho(item.produtoId, item.tamanho);
    setUpdating((p) => ({ ...p, [chaveItem(item)]: false }));
    if (!r.success) mostrarAlerta("Erro", r.error);
  };

  const handleClear = async () => {
    const ok = await confirmarAlerta("Limpar carrinho", "Tem certeza que deseja limpar o carrinho?");
    if (!ok) return;
    const r = await limparCarrinho();
    if (!r.success) mostrarAlerta("Erro", r.error);
  };

  const renderItem = ({ item }) => {
    const isUpdating = updating[chaveItem(item)];
    return (
      <View style={styles.card}>
        <Image source={{ uri: item.imagemPrincipalId }} style={styles.image} />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>{item.nomeProduto}</Text>
          <Text style={styles.meta}>{item.marca} | Tam {item.tamanho}</Text>
          <Text style={styles.price}>{formatarPreco(item.precoEmCentavos)}</Text>
          <View style={styles.qtyRow}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => handleUpdate(item, item.quantidade - 1)} disabled={isUpdating}>
              <Text style={styles.qtyBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.qty}>{item.quantidade}</Text>
            <TouchableOpacity style={[styles.qtyBtn, item.quantidade >= item.unidadesEmEstoque && styles.qtyBtnDisabled]} onPress={() => handleUpdate(item, item.quantidade + 1)} disabled={isUpdating || item.quantidade >= item.unidadesEmEstoque}>
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.right}>
          <Text style={styles.subtotal}>{formatarPreco(item.subtotalEmCentavos)}</Text>
          <TouchableOpacity onPress={() => handleRemove(item)} disabled={isUpdating}>
            {isUpdating ? <ActivityIndicator size="small" color="#c25b5b" /> : <Text style={styles.removeText}>Remover</Text>}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>Carrinho vazio</Text>
      <Text style={styles.emptyText}>Adicione pecas para comecar.</Text>
      <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.shopBtnText}>Continuar comprando</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !carrinho) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#5a7fbb" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>Voltar</Text></TouchableOpacity>
        <Text style={styles.title}>Carrinho</Text>
        <View style={{ width: 60 }} />
      </View>

      <FlatList data={carrinho?.itens || []} renderItem={renderItem} keyExtractor={(i) => `${i.produtoId}-${i.tamanho}`} ListEmptyComponent={renderEmpty} contentContainerStyle={{ paddingBottom: 16, flexGrow: 1 }} />

      {carrinho?.itens?.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleClear}><Text style={styles.clearText}>Limpar carrinho</Text></TouchableOpacity>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatarPreco(valorTotalEmCentavos)}</Text>
          </View>
          <TouchableOpacity style={styles.checkout} onPress={() => navigation.navigate("Payment")}>
            <Text style={styles.checkoutText}>Ir para o pagamento</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a2331" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: "#222f42", borderBottomWidth: 2, borderBottomColor: "#c25b5b", marginTop: 40 },
  back: { fontFamily: "Oswald_600SemiBold", color: "#a3b8d0", fontSize: 13, letterSpacing: 1, textTransform: "uppercase" },
  title: { fontFamily: "Oswald_700Bold", fontSize: 20, color: "#f0f3f8", letterSpacing: 2 },
  card: { flexDirection: "row", backgroundColor: "#222f42", marginHorizontal: 16, marginTop: 16, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: "#2e3d54" },
  image: { width: 80, height: 100, borderRadius: 6, backgroundColor: "#1a2331" },
  info: { flex: 1, marginLeft: 12 },
  name: { fontFamily: "Oswald_600SemiBold", fontSize: 14, color: "#f0f3f8", marginBottom: 2 },
  meta: { fontFamily: "Oswald_400Regular", fontSize: 11, color: "#7d9cc0", marginBottom: 6 },
  price: { fontFamily: "Oswald_400Regular", fontSize: 13, color: "#a3b8d0", marginBottom: 8 },
  qtyRow: { flexDirection: "row", alignItems: "center" },
  qtyBtn: { width: 30, height: 30, borderRadius: 4, backgroundColor: "#5a7fbb", justifyContent: "center", alignItems: "center" },
  qtyBtnDisabled: { backgroundColor: "#2e3d54" },
  qtyBtnText: { fontFamily: "Oswald_700Bold", color: "#f0f3f8", fontSize: 16 },
  qty: { fontFamily: "Oswald_600SemiBold", marginHorizontal: 14, fontSize: 15, minWidth: 24, textAlign: "center", color: "#f0f3f8" },
  right: { alignItems: "flex-end", justifyContent: "space-between" },
  subtotal: { fontFamily: "Oswald_700Bold", fontSize: 15, color: "#f0f3f8" },
  removeText: { fontFamily: "Oswald_600SemiBold", color: "#c25b5b", fontSize: 11, letterSpacing: 1, textTransform: "uppercase" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  emptyTitle: { fontFamily: "Oswald_600SemiBold", fontSize: 22, color: "#f0f3f8", marginBottom: 8 },
  emptyText: { fontFamily: "Oswald_400Regular", fontSize: 14, color: "#7d9cc0", marginBottom: 24, textAlign: "center" },
  shopBtn: { backgroundColor: "#c25b5b", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 4 },
  shopBtnText: { fontFamily: "Oswald_700Bold", color: "#f0f3f8", fontSize: 13, letterSpacing: 1, textTransform: "uppercase" },
  footer: { backgroundColor: "#222f42", padding: 16, borderTopWidth: 2, borderTopColor: "#c25b5b" },
  clearText: { fontFamily: "Oswald_600SemiBold", color: "#c25b5b", fontSize: 12, letterSpacing: 1, marginBottom: 12, textTransform: "uppercase" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  totalLabel: { fontFamily: "Oswald_600SemiBold", fontSize: 16, color: "#a3b8d0", letterSpacing: 1 },
  totalValue: { fontFamily: "Oswald_700Bold", fontSize: 24, color: "#f0f3f8" },
  checkout: { backgroundColor: "#c25b5b", padding: 16, borderRadius: 4, alignItems: "center" },
  checkoutText: { fontFamily: "Oswald_700Bold", color: "#f0f3f8", fontSize: 14, letterSpacing: 2, textTransform: "uppercase" },
});
