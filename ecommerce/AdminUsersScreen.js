import { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useAuth } from "./AuthContext";
import { apiFetch } from "./api";
import { mostrarAlerta, confirmarAlerta } from "./AlertaGlobal";

export default function AdminUsersScreen({ navigation }) {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  const carregar = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/users", { headers: { "x-user-id": String(user.id) } });
      const data = await res.json();
      if (data.success) setUsuarios(data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { carregar(); }, []);

  const excluir = async (u) => {
    const ok = await confirmarAlerta("Excluir usuario", `Excluir ${u.nome_completo} (${u.email})?`);
    if (!ok) return;
    try {
      const res = await apiFetch(`/api/users/${u.id}`, { method: "DELETE", headers: { "x-user-id": String(user.id) } });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.error?.message || "Falha ao excluir");
      await carregar();
      mostrarAlerta("Sucesso", "Usuario excluido");
    } catch (e) { mostrarAlerta("Erro", e.message); }
  };

  const renderUsuario = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.nome}>{item.nome_completo}</Text>
        <Text style={styles.email}>{item.email}</Text>
        <View style={styles.tipoBadge}><Text style={styles.tipoText}>{item.tipo}</Text></View>
      </View>
      <TouchableOpacity style={styles.excluirBtn} onPress={() => excluir(item)}>
        <Text style={styles.excluirText}>Excluir</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>Voltar</Text></TouchableOpacity>
        <Text style={styles.title}>Usuarios</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#5a7fbb" /></View>
      ) : (
        <FlatList
          data={usuarios}
          renderItem={renderUsuario}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={styles.empty}>Nenhum usuario cadastrado.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a2331" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: "#222f42", marginTop: 40, borderBottomWidth: 2, borderBottomColor: "#c25b5b" },
  back: { fontFamily: "Oswald_600SemiBold", color: "#a3b8d0", fontSize: 13, letterSpacing: 1, textTransform: "uppercase" },
  title: { fontFamily: "Oswald_700Bold", fontSize: 18, color: "#f0f3f8", letterSpacing: 2 },
  card: { flexDirection: "row", backgroundColor: "#222f42", borderRadius: 8, padding: 14, marginBottom: 10, alignItems: "center", borderWidth: 1, borderColor: "#2e3d54" },
  info: { flex: 1 },
  nome: { fontFamily: "Oswald_600SemiBold", fontSize: 14, color: "#f0f3f8" },
  email: { fontFamily: "Oswald_400Regular", fontSize: 12, color: "#7d9cc0", marginTop: 2 },
  tipoBadge: { alignSelf: "flex-start", backgroundColor: "#2a3850", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 6 },
  tipoText: { fontFamily: "Oswald_600SemiBold", fontSize: 10, color: "#a3b8d0", letterSpacing: 1, textTransform: "uppercase" },
  excluirBtn: { backgroundColor: "#c25b5b", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 4 },
  excluirText: { fontFamily: "Oswald_600SemiBold", color: "#f0f3f8", fontSize: 11, letterSpacing: 1, textTransform: "uppercase" },
  empty: { fontFamily: "Oswald_400Regular", textAlign: "center", color: "#7d9cc0", marginTop: 40 },
});
