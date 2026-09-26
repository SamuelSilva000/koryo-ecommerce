import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "./AuthContext";
import { mostrarAlerta } from "./AlertaGlobal";

export default function LoginScreen({ navigation }) {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [passwordVisible, setPasswordVisible] = useState(false);
const [loading, setLoading] = useState(false);
const { login } = useAuth();

const handleLogin = async () => {
if (!email || !password) {
mostrarAlerta("Atencao", "Preencha email e senha");
return;
}
setLoading(true);
const result = await login(email, password);
setLoading(false);
if (!result.success) mostrarAlerta("Falha no login", result.error);
};

return (
<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
<ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
<View style={styles.content}>
<Text style={styles.brand}>KORYO</Text>
<Text style={styles.tagline}>Moda com identidade</Text>
<Text style={styles.title}>Bem-vindo de volta</Text>
<Text style={styles.subtitle}>Acesse sua conta</Text>
<View style={styles.form}>
<Text style={styles.label}>E-mail</Text>
<TextInput style={styles.input} placeholder="seu@exemplo.com" placeholderTextColor="#7d9cc0" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" editable={!loading} />
<Text style={styles.label}>Senha</Text>
<View style={styles.inputContainer}>
<TextInput style={[styles.input, styles.inputWithIcon]} placeholder="Digite sua senha" placeholderTextColor="#7d9cc0" value={password} onChangeText={setPassword} secureTextEntry={!passwordVisible} autoCapitalize="none" editable={!loading} />
<TouchableOpacity onPress={() => setPasswordVisible((v) => !v)} style={styles.eyeButton} disabled={loading}>
<MaterialIcons name={passwordVisible ? "visibility-off" : "visibility"} size={22} color="#7d9cc0" />
</TouchableOpacity>
</View>
<TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
{loading ? <ActivityIndicator color="#f0f3f8" /> : <Text style={styles.buttonText}>Entrar</Text>}
</TouchableOpacity>
<View style={styles.footer}>
<Text style={styles.footerText}>Nao tem conta? </Text>
<TouchableOpacity onPress={() => navigation.navigate("SignUp")} disabled={loading}>
<Text style={styles.link}>Cadastre-se</Text>
</TouchableOpacity>
</View>
</View>
</View>
</ScrollView>
</KeyboardAvoidingView>
);
}

const styles = StyleSheet.create({
container: { flex: 1, backgroundColor: "#1a2331" },
scrollContent: { flexGrow: 1 },
content: { flex: 1, padding: 24, justifyContent: "center", alignItems: "center" },
brand: { fontFamily: "Oswald_700Bold", fontSize: 56, color: "#f0f3f8", marginBottom: 4, letterSpacing: 6, textAlign: "center" },
tagline: { fontFamily: "Oswald_400Regular", fontSize: 12, color: "#7d9cc0", marginBottom: 48, letterSpacing: 4, textTransform: "uppercase", textAlign: "center" },
title: { fontFamily: "Oswald_600SemiBold", fontSize: 22, marginBottom: 6, color: "#f0f3f8", textAlign: "center" },
subtitle: { fontFamily: "Oswald_400Regular", fontSize: 14, color: "#7d9cc0", marginBottom: 32, textAlign: "center" },
form: { gap: 16, width: "100%" },
label: { fontFamily: "Oswald_600SemiBold", fontSize: 12, color: "#a3b8d0", marginBottom: -8, letterSpacing: 1, textTransform: "uppercase" },
input: { fontFamily: "Oswald_400Regular", borderWidth: 1, borderColor: "#2e3d54", borderRadius: 6, padding: 16, fontSize: 15, backgroundColor: "#222f42", color: "#f0f3f8" },
inputContainer: { position: "relative" },
inputWithIcon: { paddingRight: 48 },
eyeButton: { position: "absolute", right: 12, top: 0, bottom: 0, justifyContent: "center", alignItems: "center", padding: 8 },
button: { backgroundColor: "#c25b5b", padding: 16, borderRadius: 6, alignItems: "center", marginTop: 8 },
buttonDisabled: { backgroundColor: "#4a3a3a" },
buttonText: { fontFamily: "Oswald_700Bold", color: "#f0f3f8", fontSize: 15, letterSpacing: 2, textTransform: "uppercase" },
footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 8 },
footerText: { fontFamily: "Oswald_400Regular", fontSize: 13, color: "#7d9cc0" },
link: { fontFamily: "Oswald_600SemiBold", fontSize: 13, color: "#5a7fbb", letterSpacing: 1 },
});
