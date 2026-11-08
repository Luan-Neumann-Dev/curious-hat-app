import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Plus, UserCheck } from "lucide-react";
import { AVATAR_PADRAO } from "../../lib/avatar";
import { comprimirImagem } from "../../lib/image";
import { enviarEmailConfirmacao } from "../../services/email";
import { saveAccount } from "../../services/session";
import type { UserProfile } from "../../types";
import { HatButton } from "../HatButton";

type FormData = Omit<UserProfile, "publicHandle">;
type CampoDoForm = keyof FormData;
type ErrosDoForm = Partial<Record<CampoDoForm, string>>;

interface ProfileFormProps {
  /** `null` quando é um cadastro novo. */
  perfilAtual: UserProfile | null;
  onSalvo: (perfil: UserProfile, mensagem: string) => void;
  onCancelar?: () => void;
}

export function ProfileForm({ perfilAtual, onSalvo, onCancelar }: ProfileFormProps) {
  const fileInputAvatarRef = useRef<HTMLInputElement>(null);
  const fileInputBannerRef = useRef<HTMLInputElement>(null);

  const [enviando, setEnviando] = useState(false);
  const [erros, setErros] = useState<ErrosDoForm>({});
  const [form, setForm] = useState<FormData>({
    userId: perfilAtual?.userId || "",
    fullName: perfilAtual?.fullName || "",
    email: perfilAtual?.email || "",
    birthDate: perfilAtual?.birthDate || "",
    accountName: perfilAtual?.accountName || "",
    codename: perfilAtual?.codename || "",
    password: perfilAtual?.password || "",
    bio: perfilAtual?.bio || "Observando tudo no Curious Hat.",
    avatarUrl: perfilAtual?.avatarUrl || AVATAR_PADRAO,
    bannerImage: perfilAtual?.bannerImage || "",
    joinedAt: perfilAtual?.joinedAt || "Outubro de 2026",
  });

  async function handleImageUpload(
    event: ChangeEvent<HTMLInputElement>,
    campoDestino: "avatarUrl" | "bannerImage",
    larguraMax: number
  ) {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;

    try {
      const base64Comprimido = await comprimirImagem(arquivo, larguraMax);
      setForm((prev) => ({ ...prev, [campoDestino]: base64Comprimido }));
    } catch {
      // Mantém a imagem atual se o arquivo não puder ser lido
    }
  }

  function validarFormulario() {
    const novosErros: ErrosDoForm = {};
    if (!form.fullName.trim() || form.fullName.trim().length < 5) {
      novosErros.fullName = "Informe seu nome completo (mínimo 5 caracteres).";
    }
    if (!form.email.trim() || !form.email.includes("@") || !form.email.includes(".")) {
      novosErros.email = "Informe um endereço de e-mail válido.";
    }
    if (!form.birthDate) {
      novosErros.birthDate = "Informe sua data de nascimento.";
    }
    if (!form.accountName.trim() || form.accountName.trim().length < 3) {
      novosErros.accountName = "Escolha seu Nome no Site (mínimo 3 letras).";
    }
    if (!form.codename.trim() || form.codename.trim().length < 3) {
      novosErros.codename = "Escolha seu Vulgo secreto (mínimo 3 letras).";
    }
    if (!form.password || form.password.length < 6) {
      novosErros.password = "A senha deve ter pelo menos 6 caracteres.";
    }
    if (!form.bio.trim() || form.bio.trim().length < 5) {
      novosErros.bio = "Escreva uma bio para o seu perfil.";
    }
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  function handleChange(campo: CampoDoForm, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    if (erros[campo]) {
      setErros((prev) => ({ ...prev, [campo]: "" }));
    }
  }

  async function handleSalvar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validarFormulario()) return;

    setEnviando(true);
    const eraContaNova = !perfilAtual;

    const handlePublico = form.accountName
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9_]/g, "");

    const dadosFinais: UserProfile = {
      ...form,
      userId:
        perfilAtual?.userId || `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      accountName: form.accountName.trim(),
      publicHandle: handlePublico || "usuario",
      codename: form.codename.trim().replace(/^@/, "").replace(/\s+/g, ""),
      bio: form.bio.trim(),
    };

    saveAccount(dadosFinais);

    let mensagem = "";
    if (eraContaNova) {
      await enviarEmailConfirmacao(dadosFinais.email, dadosFinais.accountName);
      mensagem = `Conta criada! Enviamos um e-mail de confirmação para ${dadosFinais.email}.`;
    }

    setEnviando(false);
    onSalvo(dadosFinais, mensagem);
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="border-b border-white/30 pb-4 mb-6">
        <h1 className="text-2xl font-extrabold text-white">
          {perfilAtual ? "Editar Perfil" : "Criar sua conta no Curious Hat 🎩"}
        </h1>
        <p className="text-zinc-400 text-xs sm:text-sm mt-1">
          Passe o cursor sobre a foto ou capa para clicar no '+' e escolher uma imagem dos seus arquivos.
        </p>
      </div>

      <div className="mb-6 border border-white/30 rounded-2xl overflow-hidden bg-zinc-950">
        <div
          onClick={() => fileInputBannerRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && fileInputBannerRef.current?.click()}
          aria-label="Alterar papel de parede"
          className="relative h-36 sm:h-44 w-full bg-gradient-to-r from-purple-900 via-zinc-900 to-red-950 cursor-pointer group overflow-hidden"
        >
          {form.bannerImage && (
            <img
              src={form.bannerImage}
              alt="Capa do perfil"
              className="w-full h-full object-cover group-hover:opacity-50 transition-opacity"
            />
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
            <Plus size={38} strokeWidth={2.5} className="text-white" />
            <span className="text-xs font-bold mt-1">Escolher Papel de Parede</span>
          </div>
          <input
            ref={fileInputBannerRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, "bannerImage", 900)}
            className="hidden"
          />
        </div>

        <div className="px-5 pb-4 flex items-end justify-between -mt-14 relative">
          <div
            onClick={() => fileInputAvatarRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && fileInputAvatarRef.current?.click()}
            aria-label="Alterar foto de perfil"
            className="relative w-28 h-28 rounded-full border-4 border-black bg-zinc-900 overflow-hidden cursor-pointer group shadow-xl"
          >
            <img
              src={form.avatarUrl}
              alt="Foto de perfil"
              className="w-full h-full object-cover group-hover:opacity-40 transition-opacity"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
              <Plus size={42} strokeWidth={3} className="text-white drop-shadow" />
            </div>
            <input
              ref={fileInputAvatarRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, "avatarUrl", 300)}
              className="hidden"
            />
          </div>

          <span className="text-xs text-zinc-400">
            Clique na foto ou capa para enviar arquivo
          </span>
        </div>
      </div>

      <form onSubmit={handleSalvar} noValidate className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="accountName" className="block font-bold text-white text-sm mb-1">
              Nome no Site (Público no Perfil) *
            </label>
            <input
              id="accountName"
              type="text"
              placeholder="Ex: Bernardo Bertolo"
              value={form.accountName}
              onChange={(e) => handleChange("accountName", e.target.value)}
              className="w-full bg-black border border-white p-3 rounded-xl text-white text-sm"
            />
            {erros.accountName && (
              <p role="alert" className="text-red-400 text-xs font-bold mt-1">⚠️ {erros.accountName}</p>
            )}
          </div>

          <div>
            <label htmlFor="codename" className="block font-bold text-purple-400 text-sm mb-1">
              Vulgo Anônimo (Oculto do Perfil 🎩) *
            </label>
            <input
              id="codename"
              type="text"
              placeholder="Ex: SombraDoBlocoC"
              value={form.codename}
              onChange={(e) => handleChange("codename", e.target.value)}
              className="w-full bg-black border border-purple-400 p-3 rounded-xl text-white text-sm"
            />
            {erros.codename && (
              <p role="alert" className="text-red-400 text-xs font-bold mt-1">⚠️ {erros.codename}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="bio" className="block font-bold text-white text-sm mb-1">
            Bio do Perfil *
          </label>
          <textarea
            id="bio"
            rows={2}
            maxLength={160}
            value={form.bio}
            onChange={(e) => handleChange("bio", e.target.value)}
            className="w-full bg-black border border-white p-3 rounded-xl text-white text-sm"
          />
          {erros.bio && (
            <p role="alert" className="text-red-400 text-xs font-bold mt-1">⚠️ {erros.bio}</p>
          )}
        </div>

        <div className="pt-2 border-t border-white/20">
          <p className="text-xs text-zinc-400 mb-3 font-semibold">
            🔒 Dados privados de cadastro e login (não aparecem no seu perfil público):
          </p>

          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block font-bold text-white text-sm mb-1">
                Nome Completo *
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="Seu nome completo"
                value={form.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                className="w-full bg-black border border-white/60 p-3 rounded-xl text-white text-sm"
              />
              {erros.fullName && (
                <p role="alert" className="text-red-400 text-xs font-bold mt-1">⚠️ {erros.fullName}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block font-bold text-white text-sm mb-1">
                  E-mail (Para Login e Confirmação) *
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="w-full bg-black border border-white/60 p-3 rounded-xl text-white text-sm"
                />
                {erros.email && (
                  <p role="alert" className="text-red-400 text-xs font-bold mt-1">⚠️ {erros.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="birthDate" className="block font-bold text-white text-sm mb-1">
                  Data de Nascimento *
                </label>
                <input
                  id="birthDate"
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => handleChange("birthDate", e.target.value)}
                  className="w-full bg-black border border-white/60 p-3 rounded-xl text-white text-sm"
                />
                {erros.birthDate && (
                  <p role="alert" className="text-red-400 text-xs font-bold mt-1">⚠️ {erros.birthDate}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block font-bold text-white text-sm mb-1">
                Senha de Acesso *
              </label>
              <input
                id="password"
                type="password"
                placeholder="Mínimo de 6 caracteres"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                className="w-full bg-black border border-white/60 p-3 rounded-xl text-white text-sm"
              />
              {erros.password && (
                <p role="alert" className="text-red-400 text-xs font-bold mt-1">⚠️ {erros.password}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-white/30">
          {perfilAtual && (
            <HatButton variant="outline" onClick={onCancelar}>
              Cancelar
            </HatButton>
          )}
          <HatButton type="submit" variant="purple" disabled={enviando}>
            <UserCheck size={18} aria-hidden="true" />
            <span>
              {enviando
                ? "Salvando..."
                : perfilAtual
                ? "Salvar Perfil"
                : "Criar Conta e Enviar E-mail"}
            </span>
          </HatButton>
        </div>
      </form>
    </div>
  );
}
