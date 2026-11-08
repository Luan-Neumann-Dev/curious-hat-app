import { useState } from "react";
import { useParams } from "react-router-dom";
import { ProfileForm } from "../components/profile/ProfileForm";
import { ProfileView } from "../components/profile/ProfileView";
import { useProfileData } from "../hooks/useProfileData";
import { getCurrentProfile } from "../services/session";
import type { UserProfile } from "../types";

interface ProfileProps {
  onProfileSaved: (perfil: UserProfile) => void;
  onLogout: () => void;
}

export function Profile({ onProfileSaved, onLogout }: ProfileProps) {
  const { id: idUrl } = useParams(); // ID ou nome do usuário quando clicamos no perfil de alguém
  const [meuPerfil, setMeuPerfil] = useState(getCurrentProfile);
  const [editando, setEditando] = useState(false);

  const visitandoOutroUsuario =
    Boolean(idUrl) &&
    idUrl !== meuPerfil?.userId &&
    decodeURIComponent(idUrl ?? "").toLowerCase() !== meuPerfil?.accountName?.toLowerCase();

  const { posts, setPosts, perfilVisitado, loading } = useProfileData(
    idUrl,
    visitandoOutroUsuario,
    meuPerfil
  );

  if ((editando || !meuPerfil) && !visitandoOutroUsuario) {
    return (
      <ProfileForm
        perfilAtual={meuPerfil}
        onCancelar={() => setEditando(false)}
        onSalvo={(novoPerfil) => {
          setMeuPerfil(novoPerfil);
          setEditando(false);
          onProfileSaved(novoPerfil);
        }}
      />
    );
  }

  const dadosExibidos = visitandoOutroUsuario ? perfilVisitado : meuPerfil;

  if (!dadosExibidos) {
    return (
      <p className="p-8 text-center text-muted">
        {loading ? "Carregando perfil..." : "Perfil não encontrado."}
      </p>
    );
  }

  return (
    <ProfileView
      dados={dadosExibidos}
      visitandoOutroUsuario={visitandoOutroUsuario}
      posts={posts}
      setPosts={setPosts}
      loading={loading}
      onEditar={() => setEditando(true)}
      onLogout={onLogout}
    />
  );
}
