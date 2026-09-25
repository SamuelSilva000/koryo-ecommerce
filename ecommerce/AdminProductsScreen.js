import { useState, useEffect } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, ScrollView, Image } from "react-native";
import { useAuth } from "./AuthContext";
import { apiFetch } from "./api";
import { mostrarAlerta, confirmarAlerta } from "./AlertaGlobal";

const produtoVazio = { nome: "", marca: "", descricao: "", numeracao: "", cor: "", precoReais: "", unidadesEmEstoque: "", imagemPrincipalId: "" };

export default function AdminProductsScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(produtoVazio);
  const [salvando, setSalvando] = useState(false);

  const isAdminGeral = user?.tipo === "admin_geral";

  const carregar = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/products?limit=100");
      const data = await res.json();
      if (data.success) setProdutos(data.data.products);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { carregar(); }, []);

  const abrirNovo = () => { setEditando(null); setForm(produtoVazio); setModalAberto(true); };

  const abrirEdicao = (p) => {
    setEditando(p);
    setForm({
      nome: p.nome, marca: p.marca || "", descricao: p.descricao || "", numeracao: p.numeracao || "", cor: p.cor || "",
      precoReais: (p.preco_em_centavos / 100).toFixed(2),
      unidadesEmEstoque: String(p.unidades_em_estoque),
      imagemPrincipalId: p.imagem_principal_id || "",
    });
    setModalAberto(true);
  };

  const salvar = async () => {
    if (!form.nome || !form.precoReais || form.unidadesEmEstoque === "") { mostrarAlerta("Atencao", "Preencha nome, preco e estoque"); return; }
    const precoEmCentavos = Math.round(parseFloat(form.precoReais.replace(",", ".")) * 100);
    if (isNaN(precoEmCentavos) || precoEmCentavos <= 0) { mostrarAlerta("Atencao", "Preco invalido"); return; }
    setSalvando(true);
    try {
      const body = { nome: form.nome, marca: form.marca, descricao: form.descricao, numeracao: form.numeracao, cor: form.cor, precoEmCentavos, unidadesEmEstoque: parseInt(form.unidadesEmEstoque), imagemPrincipalId: form.imagemPrincipalId };
      const url = editando ? `/api/products/${editando.id}` : "/api/products";
      const method = editando ? "PUT" : "POST";
      const res = await apiFetch(url, { method, headers: { "Content-Type": "application/json", "x-user-id": String(user.id) }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.error?.message || "Falha ao salvar");
      setModalAberto(false);
      await carregar();
      mostrarAlerta("Sucesso", editando ? "Produto atualizado" : "Produto cadastrado");
    } catch (e) { mostrarAlerta("Erro", e.message); }
    finally { setSalvando(false); }
  };

  const excluir = async (p) => {
    const ok = await confirmarAlerta("Excluir produto", `Tem certeza que deseja excluir ${p.nome}?`);
    if (!ok) return;
    try {
      const res = await apiFetch(`/api/products/${p.id}`, { method: "DELETE", headers: { "x-user-id": String(user.id) } });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.error?.message || "Falha ao excluir");
      await carregar();
      mostrarAlerta("Sucesso", "Produto excluido");
    } catch (e) { mostrarAlerta("Erro", e.message); }
  };

  const renderProduto = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.imagem_principal_id }} style={styles.thumb} />
      <View style={styles.info}>
        <Text style={styles.marca}>{item.marca}</Text>
        <Text style={styles.nome} numberOfLines={2}>{item.nome}</Text>
        <Text style={styles.meta}>Tam {item.numeracao}</Text>
        <Text style={styles.preco}>R$ {(item.preco_em_centavos / 100).toFixed(2)}</Text>
        <Text style={styles.estoque}>Estoque: {item.unidades_em_estoque}</Text>
      </View>
      <View style={styles.acoes}>
        <TouchableOpacity style={styles.editarBtn} onPress={() => abrirEdicao(item)}>
          <Text style={styles.editarText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.excluirBtn} onPress={() => excluir(item)}>
          <Text style={styles.excluirText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {isAdminGeral ? (
          <TouchableOpacity onPress={logout}><Text style={styles.back}>Sair</Text></TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>Voltar</Text></TouchableOpacity>
        )}
        <Text style={styles.title}>Produtos</Text>
        {isAdminGeral ? (
          <View style={styles.headerAcoes}>
            <TouchableOpacity onPress={() => navigation.navigate("AdminOrders")}><Text style={styles.back}>Pedidos</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate("AdminUsers")}><Text style={styles.back}>Usuarios</Text></TouchableOpacity>
          </View>
        ) : (<View style={{ width: 60 }} />)}
      </View>

      <TouchableOpacity style={styles.novoBtn} onPress={abrirNovo}>
        <Text style={styles.novoBtnText}>+ Nova Peca</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#5a7fbb" /></View>
      ) : (
        <FlatList data={produtos} renderItem={renderProduto} keyExtractor={(i) => String(i.id)} contentContainerStyle={{ padding: 16 }} />
      )}

      <Modal visible={modalAberto} animationType="slide" onRequestClose={() => setModalAberto(false)}>
        <ScrollView style={styles.modal} contentContainerStyle={{ padding: 20 }}>
          <Text style={styles.modalTitle}>{editando ? "Editar Peca" : "Nova Peca"}</Text>
          <Text style={styles.label}>Nome *</Text>
          <TextInput style={styles.input} value={form.nome} onChangeText={(t) => setForm({ ...form, nome: t })} placeholderTextColor="#7d9cc0" />
          <Text style={styles.label}>Marca</Text>
          <TextInput style={styles.input} value={form.marca} onChangeText={(t) => setForm({ ...form, marca: t })} placeholderTextColor="#7d9cc0" />
          <Text style={styles.label}>Descricao</Text>
          <TextInput style={[styles.input, { height: 80 }]} multiline value={form.descricao} onChangeText={(t) => setForm({ ...form, descricao: t })} placeholderTextColor="#7d9cc0" />
          <Text style={styles.label}>Tamanhos</Text>
          <TextInput style={styles.input} value={form.numeracao} onChangeText={(t) => setForm({ ...form, numeracao: t })} placeholder="P/M/G/GG" placeholderTextColor="#7d9cc0" />
          <Text style={styles.label}>Cor</Text>
          <TextInput style={styles.input} value={form.cor} onChangeText={(t) => setForm({ ...form, cor: t })} placeholderTextColor="#7d9cc0" />
          <Text style={styles.label}>Preco (Reais) *</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={form.precoReais} onChangeText={(t) => setForm({ ...form, precoReais: t })} placeholder="199.90" placeholderTextColor="#7d9cc0" />
          <Text style={styles.label}>Estoque *</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={form.unidadesEmEstoque} onChangeText={(t) => setForm({ ...form, unidadesEmEstoque: t })} placeholder="20" placeholderTextColor="#7d9cc0" />
          <Text style={styles.label}>URL da Imagem</Text>
          <TextInput style={styles.input} value={form.imagemPrincipalId} onChangeText={(t) => setForm({ ...form, imagemPrincipalId: t })} placeholder="https://..." placeholderTextColor="#7d9cc0" autoCapitalize="none" />
          <TouchableOpacity style={[styles.salvarBtn, salvando && { opacity: 0.6 }]} onPress={salvar} disabled={salvando}>
            {salvando ? <ActivityIndicator color="#f0f3f8" /> : <Text style={styles.salvarText}>Salvar</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelarBtn} onPress={() => setModalAberto(false)}>
            <Text style={styles.cancelarText}>Cancelar</Text>
          </TouchableOpacity>
        </ScrollView>
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
  headerAcoes: { flexDirection: "row", gap: 16 },
  novoBtn: { backgroundColor: "#c25b5b", margin: 16, padding: 14, borderRadius: 4, alignItems: "center" },
  novoBtnText: { fontFamily: "Oswald_700Bold", color: "#f0f3f8", fontSize: 13, letterSpacing: 2, textTransform: "uppercase" },
  card: { flexDirection: "row", backgroundColor: "#222f42", borderRadius: 8, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: "#2e3d54" },
  thumb: { width: 70, height: 85, borderRadius: 4, backgroundColor: "#1a2331" },
  info: { flex: 1, marginLeft: 12 },
  marca: { fontFamily: "Oswald_600SemiBold", fontSize: 10, color: "#5a7fbb", letterSpacing: 1, textTransform: "uppercase" },
  nome: { fontFamily: "Oswald_600SemiBold", fontSize: 14, color: "#f0f3f8" },
  meta: { fontFamily: "Oswald_400Regular", fontSize: 11, color: "#7d9cc0", marginTop: 2 },
  preco: { fontFamily: "Oswald_700Bold", fontSize: 14, color: "#f0f3f8", marginTop: 4 },
  estoque: { fontFamily: "Oswald_400Regular", fontSize: 11, color: "#a3b8d0" },
  acoes: { justifyContent: "space-between" },
  editarBtn: { backgroundColor: "#5a7fbb", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, marginBottom: 4 },
  editarText: { fontFamily: "Oswald_600SemiBold", color: "#f0f3f8", fontSize: 11, letterSpacing: 1, textTransform: "uppercase" },
  excluirBtn: { backgroundColor: "#c25b5b", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  excluirText: { fontFamily: "Oswald_600SemiBold", color: "#f0f3f8", fontSize: 11, letterSpacing: 1, textTransform: "uppercase" },
  modal: { flex: 1, backgroundColor: "#1a2331" },
  modalTitle: { fontFamily: "Oswald_700Bold", fontSize: 22, marginBottom: 20, marginTop: 20, color: "#f0f3f8", letterSpacing: 2 },
  label: { fontFamily: "Oswald_600SemiBold", fontSize: 11, color: "#a3b8d0", marginTop: 12, marginBottom: 4, letterSpacing: 1, textTransform: "uppercase" },
  input: { fontFamily: "Oswald_400Regular", borderWidth: 1, borderColor: "#2e3d54", borderRadius: 4, padding: 12, fontSize: 14, backgroundColor: "#222f42", color: "#f0f3f8" },
  salvarBtn: { backgroundColor: "#c25b5b", padding: 16, borderRadius: 4, alignItems: "center", marginTop: 24 },
  salvarText: { fontFamily: "Oswald_700Bold", color: "#f0f3f8", fontSize: 14, letterSpacing: 2, textTransform: "uppercase" },
  cancelarBtn: { padding: 16, alignItems: "center", marginTop: 8, marginBottom: 40 },
  cancelarText: { fontFamily: "Oswald_600SemiBold", color: "#7d9cc0", fontSize: 13, letterSpacing: 1 },
});
