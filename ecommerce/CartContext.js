import { createContext, useState, useContext, useEffect } from "react";
import { apiFetch } from "./api";
import { useAuth } from "./AuthContext";

const CarrinhoContext = createContext();

export const useCarrinho = () => {
  const ctx = useContext(CarrinhoContext);
  if (!ctx) throw new Error("useCarrinho must be used within CarrinhoProvider");
  return ctx;
};

export const CarrinhoProvider = ({ children }) => {
  const [carrinho, setCarrinho] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      buscarCarrinho();
    } else {
      setCarrinho(null);
    }
  }, [isAuthenticated, user]);

  const headers = () => ({
    "Content-Type": "application/json",
    "x-user-id": String(user.id),
  });

  const buscarCarrinho = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await apiFetch("/api/cart", { headers: headers() });
      const data = await res.json();
      if (data.success) setCarrinho(data.data);
    } catch (e) {
      console.error("Erro ao buscar carrinho:", e);
    } finally {
      setLoading(false);
    }
  };

  const adicionarAoCarrinho = async (produtoId, quantidade = 1, tamanho = "unico") => {
    if (!user) return { success: false, error: "Nao autenticado" };
    try {
      const res = await apiFetch("/api/cart/items", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ produtoId, quantidade, tamanho }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data?.error?.message || "Falha ao adicionar" };
      }
      await buscarCarrinho();
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const atualizarItemCarrinho = async (produtoId, quantidade, tamanho = "unico") => {
    if (!user) return { success: false, error: "Nao autenticado" };
    try {
      const res = await apiFetch(`/api/cart/items/${produtoId}`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({ quantidade, tamanho }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data?.error?.message || "Falha ao atualizar" };
      }
      await buscarCarrinho();
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const removerDoCarrinho = async (produtoId, tamanho = "unico") => {
    if (!user) return { success: false, error: "Nao autenticado" };
    try {
      const res = await apiFetch(`/api/cart/items/${produtoId}?tamanho=${encodeURIComponent(tamanho)}`, {
        method: "DELETE",
        headers: headers(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data?.error?.message || "Falha ao remover" };
      }
      await buscarCarrinho();
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const limparCarrinho = async () => {
    if (!user) return { success: false, error: "Nao autenticado" };
    try {
      const res = await apiFetch("/api/cart", {
        method: "DELETE",
        headers: headers(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data?.error?.message || "Falha ao limpar" };
      }
      await buscarCarrinho();
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  return (
    <CarrinhoContext.Provider
      value={{
        carrinho,
        loading,
        quantidadeItensCarrinho: carrinho?.itens?.length || 0,
        valorTotalEmCentavos: carrinho?.valorTotalEmCentavos || 0,
        buscarCarrinho,
        adicionarAoCarrinho,
        atualizarItemCarrinho,
        removerDoCarrinho,
        limparCarrinho,
      }}
    >
      {children}
    </CarrinhoContext.Provider>
  );
};
