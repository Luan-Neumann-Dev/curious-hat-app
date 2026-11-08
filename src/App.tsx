import { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { ThemeToggle } from "./components/ThemeToggle";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Welcome } from "./pages/Welcome";
import { supabase } from "./lib/supabase";
import { carregarSessao, limparPerfilAtual, sair } from "./services/session";
import type { UserProfile } from "./types";

type TelaEntrada = "boasVindas" | "login" | "cadastro";

export default function App() {
  const [perfilAtivo, setPerfilAtivo] = useState<UserProfile | null>(null);
  const [carregandoSessao, setCarregandoSessao] = useState(true);
  const [telaEntrada, setTelaEntrada] = useState<TelaEntrada>("boasVindas");
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    let ativo = true;
    carregarSessao().then((perfil) => {
      if (!ativo) return;
      setPerfilAtivo(perfil);
      setCarregandoSessao(false);
    });

    // Fecha a sessão aqui também quando a pessoa sai em outra aba
    const { data } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === "SIGNED_OUT") {
        limparPerfilAtual();
        setPerfilAtivo(null);
        setTelaEntrada("boasVindas");
      }
    });

    return () => {
      ativo = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    await sair();
    setPerfilAtivo(null);
    setTelaEntrada("boasVindas");
  }

  function renderizarTela() {
    if (carregandoSessao) {
      return (
        <div className="min-h-screen bg-app text-muted flex items-center justify-center">
          <p role="status">Carregando...</p>
        </div>
      );
    }

    if (perfilAtivo) {
      return (
        <AppLayout
          aviso={aviso}
          onFecharAviso={() => setAviso("")}
          onProfileSaved={setPerfilAtivo}
          onLogout={handleLogout}
        />
      );
    }

    if (telaEntrada === "login") {
      return <Login onVoltar={() => setTelaEntrada("boasVindas")} onLogin={setPerfilAtivo} />;
    }

    if (telaEntrada === "cadastro") {
      return (
        <Register
          onVoltar={() => setTelaEntrada("boasVindas")}
          onCadastro={(novoPerfil, mensagem) => {
            setPerfilAtivo(novoPerfil);
            setAviso(mensagem);
          }}
        />
      );
    }

    return (
      <Welcome
        onCriarPerfil={() => setTelaEntrada("cadastro")}
        onEntrar={() => setTelaEntrada("login")}
      />
    );
  }

  return (
    <BrowserRouter>
      {!perfilAtivo && (
        <div className="fixed top-4 right-4 z-30">
          <ThemeToggle />
        </div>
      )}
      {renderizarTela()}
    </BrowserRouter>
  );
}
