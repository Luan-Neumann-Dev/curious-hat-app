import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Plus, UserCheck } from "lucide-react";
import { AVATAR_PADRAO } from "../../lib/avatar";
import { mensagemDeErro } from "../../lib/errors";
import { comprimirImagem } from "../../lib/image";
import { cadastrar, salvarPerfil } from "../../services/session";
import type { DadosDoPerfil } from "../../services/session";
import type { UserProfile } from "../../types";
import { HatButton } from "../HatButton";

type FormData = DadosDoPerfil & { password: string };
type CampoDoForm = keyof FormData;
type ErrosDoForm = Partial<Record<CampoDoForm, string>>;

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ORDEM_DOS_CAMPOS: CampoDoForm[] = [
  "accountName",
  "codename",
  "bio",
  "fullName",
  "email",
  "birthDate",
  "password",
];

function ErroDoCampo({ campo, mensagem }: { campo: CampoDoForm; mensagem?: string }) {
  if (!mensagem) return null;
  return (
    <p id={`erro-${campo}`} className="text-danger text-xs font-bold mt-1">
      <span aria-hidden="true">⚠️ </span>
      {mensagem}
    </p>
  );
}

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
  const [erroGeral, setErroGeral] = useState("");
  const [form, setForm] = useState<FormData>({
    fullName: perfilAtual?.fullName || "",
    email: perfilAtual?.email || "",
    birthDate: perfilAtual?.birthDate || "",
    accountName: perfilAtual?.accountName || "",
    codename: perfilAtual?.codename || "",
    password: "",
    bio: perfilAtual?.bio || "Observando tudo no Curious Hat.",
    avatarUrl: perfilAtual?.avatarUrl || AVATAR_PADRAO,
    bannerImage: perfilAtual?.bannerImage || "",
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
      setErroGeral("Não foi possível ler essa imagem. Tente outro arquivo.");
    }
  }

  /** Liga cada campo à sua mensagem de erro, para o leitor de tela anunciar as duas juntas. */
  function atributosDeErro(campo: CampoDoForm) {
    return erros[campo]
      ? ({ "aria-invalid": true, "aria-describedby": `erro-${campo}` } as const)
      : {};
  }

  function validarFormulario() {
    const novosErros: ErrosDoForm = {};
    if (!form.fullName.trim() || form.fullName.trim().length < 5) {
      novosErros.fullName = "Informe seu nome completo (mínimo 5 caracteres).";
    }
    if (!EMAIL_VALIDO.test(form.email.trim())) {
      novosErros.email = "Informe um endereço de e-mail válido.";
    }
    if (!form.birthDate) {
      novosErros.birthDate = "Informe sua data de nascimento.";
    } else if (new Date(form.birthDate) > new Date()) {
      novosErros.birthDate = "A data de nascimento não pode estar no futuro.";
    }
    if (form.accountName.trim().length < 3 || form.accountName.trim().length > 60) {
      novosErros.accountName = "Escolha seu Nome no Site (de 3 a 60 caracteres).";
    }
    const vulgo = form.codename.trim().replace(/^@/, "").replace(/\s+/g, "");
    if (vulgo.length < 3 || vulgo.length > 40) {
      novosErros.codename = "Escolha seu Vulgo secreto (de 3 a 40 caracteres).";
    }
    // Ao editar, a senha em branco mantém a atual
    const senhaObrigatoria = !perfilAtual || form.password.length > 0;
    if (senhaObrigatoria && form.password.length < 6) {
      novosErros.password = "A senha deve ter pelo menos 6 caracteres.";
    }
    if (!form.bio.trim() || form.bio.trim().length < 5) {
      novosErros.bio = "Escreva uma bio para o seu perfil.";
    }
    setErros(novosErros);

    const primeiroComErro = ORDEM_DOS_CAMPOS.find((campo) => novosErros[campo]);
    if (primeiroComErro) document.getElementById(primeiroComErro)?.focus();
    return !primeiroComErro;
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
    setErroGeral("");

    const { password: senha, ...resto } = form;
    const dadosFinais: DadosDoPerfil = {
      ...resto,
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      accountName: form.accountName.trim(),
      codename: form.codename.trim().replace(/^@/, "").replace(/\s+/g, ""),
      bio: form.bio.trim(),
    };

    try {
      if (perfilAtual) {
        onSalvo(await salvarPerfil(perfilAtual.userId, dadosFinais, senha), "");
        return;
      }

      const handlePublico = dadosFinais.accountName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9_]/g, "");
      const { perfil, aviso } = await cadastrar(dadosFinais, handlePublico || "usuario", senha);
      onSalvo(perfil, aviso);
    } catch (falha) {
      setErroGeral(mensagemDeErro(falha));
      setEnviando(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="border-b border-fg/30 pb-4 mb-6">
        <h1 className="text-2xl font-extrabold text-fg">
          {perfilAtual ? "Editar Perfil" : "Criar sua conta no Curious Hat 🎩"}
        </h1>
        <p className="text-muted text-xs sm:text-sm mt-1">
          Toque ou clique na foto ou na capa para escolher uma imagem dos seus arquivos.
        </p>
      </div>

      <div className="mb-6 border border-fg/30 rounded-2xl overflow-hidden bg-surface">
        <button
          type="button"
          onClick={() => fileInputBannerRef.current?.click()}
          aria-label="Alterar papel de parede"
          className="block relative h-36 sm:h-44 w-full bg-gradient-to-r from-banner-from via-banner-via to-banner-to cursor-pointer group overflow-hidden"
        >
          {form.bannerImage && (
            <img
              src={form.bannerImage}
              alt=""
              className="w-full h-full object-cover group-hover:opacity-50 transition-opacity"
            />
          )}
          <span className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
            <Plus size={38} strokeWidth={2.5} className="text-white" aria-hidden="true" />
            <span className="text-xs font-bold mt-1">Escolher Papel de Parede</span>
          </span>
        </button>
        <input
          ref={fileInputBannerRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleImageUpload(e, "bannerImage", 900)}
          className="hidden"
        />

        <div className="px-5 pb-4 flex items-end justify-between -mt-14 relative">
          <button
            type="button"
            onClick={() => fileInputAvatarRef.current?.click()}
            aria-label="Alterar foto de perfil"
            className="relative shrink-0 w-28 h-28 rounded-full border-4 border-app bg-raised overflow-hidden cursor-pointer group shadow-xl"
          >
            <img
              src={form.avatarUrl}
              alt=""
              className="w-full h-full object-cover group-hover:opacity-40 transition-opacity"
            />
            <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity bg-black/40">
              <Plus size={42} strokeWidth={3} className="text-white drop-shadow" aria-hidden="true" />
            </span>
          </button>
          <input
            ref={fileInputAvatarRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, "avatarUrl", 300)}
            className="hidden"
          />

          <span className="text-xs text-muted">
            Clique na foto ou capa para enviar arquivo
          </span>
        </div>
      </div>

      <form onSubmit={handleSalvar} noValidate className="space-y-4">
        <p className="text-xs text-muted">Campos marcados com * são obrigatórios.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="accountName" className="block font-bold text-fg text-sm mb-1">
              Nome no Site (Público no Perfil) *
            </label>
            <input
              id="accountName"
              type="text"
              required
              autoComplete="nickname"
              placeholder="Ex: Bernardo Bertolo"
              value={form.accountName}
              onChange={(e) => handleChange("accountName", e.target.value)}
              className="w-full bg-app border border-fg p-3 rounded-xl text-fg text-sm"
              {...atributosDeErro("accountName")}
            />
            <ErroDoCampo campo="accountName" mensagem={erros.accountName} />
          </div>

          <div>
            <label htmlFor="codename" className="block font-bold text-accent text-sm mb-1">
              Vulgo Anônimo (Oculto do Perfil 🎩) *
            </label>
            <input
              id="codename"
              type="text"
              required
              autoComplete="off"
              placeholder="Ex: SombraDoBlocoC"
              value={form.codename}
              onChange={(e) => handleChange("codename", e.target.value)}
              className="w-full bg-app border border-accent p-3 rounded-xl text-fg text-sm"
              {...atributosDeErro("codename")}
            />
            <ErroDoCampo campo="codename" mensagem={erros.codename} />
          </div>
        </div>

        <div>
          <label htmlFor="bio" className="block font-bold text-fg text-sm mb-1">
            Bio do Perfil *
          </label>
          <textarea
            id="bio"
            rows={2}
            required
            maxLength={160}
            value={form.bio}
            onChange={(e) => handleChange("bio", e.target.value)}
            className="w-full bg-app border border-fg p-3 rounded-xl text-fg text-sm"
            {...atributosDeErro("bio")}
          />
          <ErroDoCampo campo="bio" mensagem={erros.bio} />
        </div>

        <div className="pt-2 border-t border-fg/20">
          <p className="text-xs text-muted mb-3 font-semibold">
            🔒 Dados privados de cadastro e login (não aparecem no seu perfil público):
          </p>

          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block font-bold text-fg text-sm mb-1">
                Nome Completo *
              </label>
              <input
                id="fullName"
                type="text"
                required
                autoComplete="name"
                placeholder="Seu nome completo"
                value={form.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                className="w-full bg-app border border-fg/60 p-3 rounded-xl text-fg text-sm"
                {...atributosDeErro("fullName")}
              />
              <ErroDoCampo campo="fullName" mensagem={erros.fullName} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block font-bold text-fg text-sm mb-1">
                  E-mail (Para Login) *
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="seuemail@exemplo.com"
                  value={form.email}
                  disabled={Boolean(perfilAtual)}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="w-full bg-app border border-fg/60 p-3 rounded-xl text-fg text-sm disabled:opacity-60"
                  {...atributosDeErro("email")}
                />
                <ErroDoCampo campo="email" mensagem={erros.email} />
              </div>

              <div>
                <label htmlFor="birthDate" className="block font-bold text-fg text-sm mb-1">
                  Data de Nascimento *
                </label>
                <input
                  id="birthDate"
                  type="date"
                  required
                  autoComplete="bday"
                  value={form.birthDate}
                  onChange={(e) => handleChange("birthDate", e.target.value)}
                  className="w-full bg-app border border-fg/60 p-3 rounded-xl text-fg text-sm"
                  {...atributosDeErro("birthDate")}
                />
                <ErroDoCampo campo="birthDate" mensagem={erros.birthDate} />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block font-bold text-fg text-sm mb-1">
                {perfilAtual ? "Nova Senha" : "Senha de Acesso *"}
              </label>
              <input
                id="password"
                type="password"
                required={!perfilAtual}
                autoComplete="new-password"
                placeholder={perfilAtual ? "Deixe em branco para manter a atual" : "Mínimo de 6 caracteres"}
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                className="w-full bg-app border border-fg/60 p-3 rounded-xl text-fg text-sm"
                {...atributosDeErro("password")}
              />
              <ErroDoCampo campo="password" mensagem={erros.password} />
            </div>
          </div>
        </div>

        {erroGeral && (
          <div role="alert" className="p-3 rounded-xl border border-danger bg-danger-soft/60 text-danger text-xs font-bold">
            ⚠️ {erroGeral}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-fg/30">
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
                : "Criar Conta"}
            </span>
          </HatButton>
        </div>
      </form>
    </div>
  );
}
