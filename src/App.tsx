import { useEffect, useRef, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { HatButton } from "./components/HatButton";
import { ThemeToggle } from "./components/ThemeToggle";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Welcome } from "./pages/Welcome";
import { mensagemDeErro } from "./lib/errors";
import { supabase } from "./lib/supabase";
import { carregarSessao, limparPerfilAtual, sair } from "./services/session";
import type { UserProfile } from "./types";

type TelaEntrada = "boasVindas" | "login" | "cadastro";

const TITULOS_DE_ENTRADA: Record<TelaEntrada, string> = {
  boasVindas: "Curious Hat | Segredos Temporários",
  login: "Entrar | Curious Hat",
  cadastro: "Criar conta | Curious Hat",
};

export default function App() {
  const [perfilAtivo, setPerfilAtivo] = useState<UserProfile | null>(null);
  const [carregandoSessao, setCarregandoSessao] = useState(true);
  const [erroSessao, setErroSessao] = useState("");
  const [tentativas, setTentativas] = useState(0);
  const [telaEntrada, setTelaEntrada] = useState<TelaEntrada>("boasVindas");
  const [aviso, setAviso] = useState("");
  // Só leva o foco ao conteúdo quando a pessoa acabou de entrar, não ao reabrir o app
  const [acabouDeEntrar, setAcabouDeEntrar] = useState(false);
  const entradaRef = useRef<HTMLElement>(null);
  const telaAnterior = useRef<TelaEntrada | "app">("boasVindas");

  useEffect(() => {
    let ativo = true;
    carregarSessao()
      .then((perfil) => {
        if (ativo) setPerfilAtivo(perfil);
      })
      .catch((falha) => {
        if (ativo) setErroSessao(mensagemDeErro(falha));
      })
      .finally(() => {
        if (ativo) setCarregandoSessao(false);
      });

    return () => {
      ativo = false;
    };
  }, [tentativas]);

  useEffect(() => {
    // Fecha a sessão aqui também quando a pessoa sai em outra aba
    const { data } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === "SIGNED_OUT") {
        limparPerfilAtual();
        setPerfilAtivo(null);
        setErroSessao("");
        setTelaEntrada("boasVindas");
      }
    });

    return () => data.subscription.unsubscribe();
  }, []);

  // As telas de entrada não têm rota própria, então o título e o foco mudam aqui
  useEffect(() => {
    const tela = perfilAtivo ? "app" : telaEntrada;
    if (telaAnterior.current === tela) return;
    telaAnterior.current = tela;
    if (tela === "app") return;

    document.title = TITULOS_DE_ENTRADA[tela];
    entradaRef.current?.focus();
  }, [perfilAtivo, telaEntrada]);

  function tentarDeNovo() {
    setErroSessao("");
    setCarregandoSessao(true);
    setTentativas((total) => total + 1);
  }

  async function handleLogout() {
    await sair();
    setPerfilAtivo(null);
    setErroSessao("");
    setTelaEntrada("boasVindas");
  }

  function aoEntrar(perfil: UserProfile) {
    setAcabouDeEntrar(true);
    setPerfilAtivo(perfil);
  }

  function renderizarTela() {
    if (carregandoSessao) {
      return (
        <div className="min-h-screen bg-app text-muted flex items-center justify-center">
          <p role="status">Carregando...</p>
        </div>
      );
    }

    if (erroSessao) {
      return (
        <main className="min-h-screen bg-app text-fg flex flex-col items-center justify-center gap-4 p-6 text-center">
          <h1 className="text-2xl font-extrabold">Não conseguimos abrir sua conta</h1>
          <p role="alert" className="text-fg-soft max-w-md">{erroSessao}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <HatButton onClick={tentarDeNovo}>Tentar de novo</HatButton>
            <HatButton variant="outline" onClick={handleLogout}>Sair da conta</HatButton>
          </div>
        </main>
      );
    }

    if (perfilAtivo) {
      return (
        <AppLayout
          aviso={aviso}
          focarAoAbrir={acabouDeEntrar}
          onFecharAviso={() => setAviso("")}
          onProfileSaved={setPerfilAtivo}
          onLogout={handleLogout}
        />
      );
    }

    return (
      <main ref={entradaRef} tabIndex={-1}>
        {telaEntrada === "login" ? (
          <Login onVoltar={() => setTelaEntrada("boasVindas")} onLogin={aoEntrar} />
        ) : telaEntrada === "cadastro" ? (
          <Register
            onVoltar={() => setTelaEntrada("boasVindas")}
            onCadastro={(novoPerfil, mensagem) => {
              aoEntrar(novoPerfil);
              setAviso(mensagem);
            }}
          />
        ) : (
          <Welcome
            onCriarPerfil={() => setTelaEntrada("cadastro")}
            onEntrar={() => setTelaEntrada("login")}
          />
        )}
      </main>
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
