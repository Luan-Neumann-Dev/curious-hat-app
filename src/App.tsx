import { useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Welcome } from "./pages/Welcome";
import { clearStoredProfile, getStoredProfile } from "./services/session";
import type { UserProfile } from "./types";

type TelaEntrada = "boasVindas" | "login" | "cadastro";

export default function App() {
  const [perfilAtivo, setPerfilAtivo] = useState<UserProfile | null>(getStoredProfile);
  const [telaEntrada, setTelaEntrada] = useState<TelaEntrada>("boasVindas");
  const [avisoEmail, setAvisoEmail] = useState("");

  function handleLogout() {
    clearStoredProfile();
    setPerfilAtivo(null);
    setTelaEntrada("boasVindas");
  }

  function renderizarTela() {
    if (perfilAtivo) {
      return (
        <AppLayout
          aviso={avisoEmail}
          onFecharAviso={() => setAvisoEmail("")}
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
            setAvisoEmail(mensagem);
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

  return <BrowserRouter>{renderizarTela()}</BrowserRouter>;
}
