import { useState, useEffect, useCallback, memo } from "react";
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput, Modal, Platform, Dimensions } from "react-native";
import { useAuth } from "./AuthContext";
import { useCarrinho } from "./CartContext";
import { apiFetch } from "./api";
import { mostrarAlerta } from "./AlertaGlobal";

function parseTamanhos(numeracao) {
  if (!numeracao) return ["Unico"];
  const n = String(numeracao).trim();
  const rangeMatch = n.match(/^(\d+)\s*-\s*(\d+)$/);
  if (rangeMatch) {
    const inicio = parseInt(rangeMatch[1]);
    const fim = parseInt(rangeMatch[2]);
    const lista = [];
    for (let i = inicio; i <= fim; i++) lista.push(String(i));
    return lista;
  }
  if (n.includes("/")) return n.split("/").map(s => s.trim()).filter(Boolean);
  if (n.includes(",")) return n.split(",").map(s => s.trim()).filter(Boolean);
  return [n];
}

const Header = memo(({ logout, quantidadeItensCarrinho, isAdmin, search, setSearch, onSearch, navigation }) => (
  <View style={styles.header}>
    <View style={styles.headerTop}>
      <Text style={styles.brandTop}>KORYO</Text>
      <View style={styles.headerButtons}>
        <TouchableOpacity style={styles.ordersButton} onPress={() => navigation.navigate("Orders")}>
          <Text style={styles.ordersButtonText}>Pedidos</Text>
        </TouchableOpacity>
        {isAdmin && (
          <TouchableOpacity style={styles.ordersButton} onPress={() => navigation.navigate("AdminProducts")}>
            <Text style={styles.ordersButtonText}>Gerenciar</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.cartButton} onPress={() => navigation.navigate("Cart")}>
          <Text style={styles.cartButtonText}>Carrinho</Text>
          {quantidadeItensCarrinho > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{quantidadeItensCarrinho}</Text></View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>
    </View>
    <View style={styles.searchRow}>
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar por nome, marca ou tamanho"
        placeholderTextColor="#7d9cc0"
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={onSearch}
        returnKeyType="search"
      />
      <TouchableOpacity style={styles.searchButton} onPress={onSearch}>
        <Text style={styles.searchButtonText}>Buscar</Text>
      </TouchableOpacity>
    </View>
  </View>
));

export default function ProductsScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [addingToCart, setAddingToCart] = useState({});
  const [modalProduto, setModalProduto] = useState(null);
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState(null);
  const { logout, user } = useAuth();
  const { adicionarAoCarrinho, quantidadeItensCarrinho } = useCarrinho();

  const fetchProducts = useCallback(async (query) => {
    try {
      setLoading(true);
      const url = query ? `/api/products?q=${encodeURIComponent(query)}` : "/api/products";
      const res = await apiFetch(url);
      const data = await res.json();
      if (data.success) setProducts(data.data.products || []);
    } catch (e) {
      console.error("Erro ao carregar produtos:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchProducts(""); }, [fetchProducts]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => fetchProducts(search));
    return unsubscribe;
  }, [navigation, search, fetchProducts]);

  const handleSearch = useCallback(() => fetchProducts(search), [fetchProducts, search]);
  const formatarPreco = (c) => `R$ ${(c / 100).toFixed(2)}`;

  const abrirModal = (produto) => { setModalProduto(produto); setTamanhoSelecionado(null); };
  const fecharModal = () => { setModalProduto(null); setTamanhoSelecionado(null); };

  const confirmarAdicao = async () => {
    if (!modalProduto || !tamanhoSelecionado) { mostrarAlerta("Atencao", "Escolha um tamanho"); return; }
    const produtoId = modalProduto.id;
    setAddingToCart((p) => ({ ...p, [produtoId]: true }));
    const result = await adicionarAoCarrinho(produtoId, 1, tamanhoSelecionado);
    setAddingToCart((p) => ({ ...p, [produtoId]: false }));
    fecharModal();
    if (result.success) mostrarAlerta("Adicionado", `Peca (tam. ${tamanhoSelecionado}) no carrinho.`);
    else mostrarAlerta("Erro", result.error);
  };

  const isAdmin = user?.tipo === "admin" || user?.tipo === "lojista" || user?.tipo === "admin_geral";

  const renderProduct = ({ item }) => {
    const isOut = item.unidades_em_estoque === 0;
    const isAdding = addingToCart[item.id];
    return (
      <View style={styles.card}>
        <Image source={{ uri: item.imagem_principal_id }} style={styles.cardImage} resizeMode="cover" />
        <View style={styles.cardInfo}>
          <Text style={styles.cardBrand}>{item.marca}</Text>
          <Text style={styles.cardName} numberOfLines={2}>{item.nome}</Text>
          <Text style={styles.cardMeta}>Tam {item.numeracao}</Text>
          <Text style={styles.cardPrice}>{formatarPreco(item.preco_em_centavos)}</Text>
          <TouchableOpacity
            style={[styles.addButton, (isAdding || isOut) && styles.addButtonDisabled]}
            onPress={() => abrirModal(item)}
            disabled={isAdding || isOut}
          >
            {isAdding ? <ActivityIndicator size="small" color="#f0f3f8" /> : <Text style={styles.addButtonText}>{isOut ? "Esgotado" : "Adicionar"}</Text>}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && products.length === 0) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#5a7fbb" /></View>;
  }

  const tamanhosDisponiveis = modalProduto ? parseTamanhos(modalProduto.numeracao) : [];

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={
          <Header
            logout={logout}
            quantidadeItensCarrinho={quantidadeItensCarrinho}
            isAdmin={isAdmin}
            search={search}
            setSearch={setSearch}
            onSearch={handleSearch}
            navigation={navigation}
          />
        }
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProducts(search); }} tintColor="#5a7fbb" />}
      />

      <Modal visible={!!modalProduto} animationType="fade" transparent onRequestClose={fecharModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalAccent} />
            <Text style={styles.modalTitle}>Tamanho</Text>
            {modalProduto && <Text style={styles.modalProdutoNome} numberOfLines={2}>{modalProduto.nome}</Text>}
            <View style={styles.chipsWrap}>
              {tamanhosDisponiveis.map((t) => {
                const sel = tamanhoSelecionado === t;
                return (
                  <TouchableOpacity key={t} style={[styles.chip, sel && styles.chipSelecionado]} onPress={() => setTamanhoSelecionado(t)}>
                    <Text style={[styles.chipText, sel && styles.chipTextSelecionado]}>{t}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelar} onPress={fecharModal}>
                <Text style={styles.modalCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalConfirmar, !tamanhoSelecionado && styles.modalConfirmarDisabled]} onPress={confirmarAdicao} disabled={!tamanhoSelecionado}>
                <Text style={styles.modalConfirmarText}>Adicionar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a2331" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { backgroundColor: "#222f42", padding: 16, marginTop: 40, borderBottomWidth: 2, borderBottomColor: "#c25b5b" },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  brandTop: { fontFamily: "Oswald_700Bold", fontSize: 28, color: "#f0f3f8", letterSpacing: 4 },
  headerButtons: { flexDirection: "row", alignItems: "center", gap: 6 },
  ordersButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 4, borderWidth: 1, borderColor: "#5a7fbb" },
  ordersButtonText: { fontFamily: "Oswald_600SemiBold", color: "#a3b8d0", fontSize: 11, letterSpacing: 1, textTransform: "uppercase" },
  cartButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 4, backgroundColor: "#c25b5b", position: "relative" },
  cartButtonText: { fontFamily: "Oswald_600SemiBold", color: "#f0f3f8", fontSize: 11, letterSpacing: 1, textTransform: "uppercase" },
  badge: { position: "absolute", top: -6, right: -6, backgroundColor: "#5a7fbb", borderRadius: 10, minWidth: 20, height: 20, justifyContent: "center", alignItems: "center", paddingHorizontal: 4 },
  badgeText: { fontFamily: "Oswald_700Bold", color: "#f0f3f8", fontSize: 11 },
  logoutButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 4, borderWidth: 1, borderColor: "#2e3d54" },
  logoutText: { fontFamily: "Oswald_600SemiBold", color: "#7d9cc0", fontSize: 11, letterSpacing: 1, textTransform: "uppercase" },
  searchRow: { flexDirection: "row", gap: 8 },
  searchInput: { fontFamily: "Oswald_400Regular", flex: 1, borderWidth: 1, borderColor: "#2e3d54", borderRadius: 4, padding: 10, fontSize: 13, backgroundColor: "#1a2331", color: "#f0f3f8" },
  searchButton: { backgroundColor: "#c25b5b", paddingHorizontal: 16, justifyContent: "center", borderRadius: 4 },
  searchButtonText: { fontFamily: "Oswald_600SemiBold", color: "#f0f3f8", fontSize: 12, letterSpacing: 1, textTransform: "uppercase" },
  listContent: { paddingBottom: 16, paddingHorizontal: 8 },
  row: { justifyContent: "space-between", paddingHorizontal: 8 },
  card: { backgroundColor: "#222f42", borderRadius: 8, marginTop: 16, flex: 1, marginHorizontal: 4, borderWidth: 1, borderColor: "#2e3d54", overflow: "hidden" },
  cardImage: { width: "100%", height: 160, backgroundColor: "#1a2331" },
  cardInfo: { padding: 12 },
  cardBrand: { fontFamily: "Oswald_600SemiBold", fontSize: 10, color: "#5a7fbb", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 },
  cardName: { fontFamily: "Oswald_600SemiBold", fontSize: 14, color: "#f0f3f8", marginBottom: 6 },
  cardMeta: { fontFamily: "Oswald_400Regular", fontSize: 11, color: "#7d9cc0", marginBottom: 8 },
  cardPrice: { fontFamily: "Oswald_700Bold", fontSize: 18, color: "#f0f3f8", marginBottom: 10 },
  addButton: { backgroundColor: "#c25b5b", padding: 10, borderRadius: 4, alignItems: "center" },
  addButtonDisabled: { backgroundColor: "#4a3a3a" },
  addButtonText: { fontFamily: "Oswald_700Bold", color: "#f0f3f8", fontSize: 11, letterSpacing: 1, textTransform: "uppercase" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(10,20,40,0.75)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalBox: { backgroundColor: "#222f42", borderRadius: 8, padding: 24, width: "100%", maxWidth: 400, borderWidth: 1, borderColor: "#2e3d54" },
  modalAccent: { height: 3, backgroundColor: "#c25b5b", borderRadius: 2, marginBottom: 16, width: 40 },
  modalTitle: { fontFamily: "Oswald_600SemiBold", fontSize: 18, color: "#f0f3f8", marginBottom: 6, letterSpacing: 1 },
  modalProdutoNome: { fontFamily: "Oswald_400Regular", fontSize: 13, color: "#7d9cc0", marginBottom: 20 },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 4, borderWidth: 1, borderColor: "#2e3d54", backgroundColor: "#1a2331", minWidth: 44, alignItems: "center" },
  chipSelecionado: { backgroundColor: "#5a7fbb", borderColor: "#5a7fbb" },
  chipText: { fontFamily: "Oswald_600SemiBold", fontSize: 13, color: "#a3b8d0", letterSpacing: 1 },
  chipTextSelecionado: { color: "#f0f3f8" },
  modalActions: { flexDirection: "row", gap: 12 },
  modalCancelar: { flex: 1, paddingVertical: 12, borderRadius: 4, borderWidth: 1, borderColor: "#2e3d54", alignItems: "center" },
  modalCancelarText: { fontFamily: "Oswald_600SemiBold", color: "#7d9cc0", fontSize: 13, letterSpacing: 1, textTransform: "uppercase" },
  modalConfirmar: { flex: 1, paddingVertical: 12, borderRadius: 4, backgroundColor: "#c25b5b", alignItems: "center" },
  modalConfirmarDisabled: { backgroundColor: "#4a3a3a" },
  modalConfirmarText: { fontFamily: "Oswald_700Bold", color: "#f0f3f8", fontSize: 13, letterSpacing: 1, textTransform: "uppercase" },
});
