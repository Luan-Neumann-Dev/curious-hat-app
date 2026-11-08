import { useState } from "react";
import { Link } from "react-router-dom";
import { HelpCircle, LogOut, ShieldCheck, UserCog } from "lucide-react";
import { ThemeToggle } from "../components/ThemeToggle";
import { mensagemDeErro } from "../lib/errors";
import { getCurrentProfile, salvarPreferencias } from "../services/session";
import type { Preferencias } from "../types";

const OPCOES: { campo: keyof Preferencias; rotulo: string; dica: string }[] = [
  {
    campo: "anonimoPorPadrao",
    rotulo: "Postar como anônimo por padrão",
    dica: "A caixa de publicação já abre no modo anônimo. Dá para trocar em cada hat.",
  },
  {
    campo: "aceitarChatsAnonimos",
    rotulo: "Aceitar chats anônimos",
    dica: "Pessoas podem te chamar sem revelar quem são.",
  },
  {
    campo: "mostrarContagens",
    rotulo: "Mostrar contagens",
    dica: "Fogos e respostas visíveis nos hats.",
  },
];

const PADRAO: Preferencias = {
  anonimoPorPadrao: false,
  aceitarChatsAnonimos: true,
  mostrarContagens: true,
};

interface SettingsProps {
  onLogout: () => void;
}

export function Settings({ onLogout }: SettingsProps) {
  const [preferencias, setPreferencias] = useState<Preferencias>(
    () => getCurrentProfile()?.preferencias ?? PADRAO
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function alternar(campo: keyof Preferencias) {
    const anteriores = preferencias;
    const novas = { ...preferencias, [campo]: !preferencias[campo] };
    try {
      setSalvando(true);
      setErro("");
      setPreferencias(novas);
      await salvarPreferencias(novas);
    } catch (err) {
      setPreferencias(anteriores);
      setErro(mensagemDeErro(err));
    } finally {
      setSalvando(false);
    }
  }

  const estiloDaLinha = "flex items-center gap-4 py-4 border-t border-fg/20";
  const estiloDoLink =
    "flex items-center gap-2 px-4 py-2 rounded-full border border-fg/50 hover:bg-raised text-fg font-bold text-sm transition";

  return (
    <div>
      <div className="border-b border-fg/40 p-4 bg-app">
        <h1 className="text-xl font-extrabold text-fg">Config</h1>
      </div>

      <div className="p-4 max-w-2xl">
        <p className="text-sm text-muted mb-5">
          O anonimato é por hat, não por conta. Estes ajustes decidem o padrão da caixa de publicação.
        </p>

        {erro && (
          <div role="alert" className="mb-4 p-3 border border-danger bg-danger-soft/70 text-fg text-sm rounded-xl">
            {erro}
          </div>
        )}

        <div className={estiloDaLinha}>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-fg">Tema</p>
            <p className="text-xs text-muted">Escolha entre o tema escuro e o claro.</p>
          </div>
          <ThemeToggle />
        </div>

        {OPCOES.map(({ campo, rotulo, dica }) => (
          <div key={campo} className={estiloDaLinha}>
            <div className="flex-1 min-w-0">
              <p id={`rotulo-${campo}`} className="font-bold text-fg">{rotulo}</p>
              <p className="text-xs text-muted">{dica}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={preferencias[campo]}
              aria-labelledby={`rotulo-${campo}`}
              disabled={salvando}
              onClick={() => alternar(campo)}
              className={`relative w-12 h-7 rounded-full border transition cursor-pointer shrink-0 disabled:cursor-wait ${
                preferencias[campo] ? "bg-primary border-primary-line" : "bg-raised border-fg/40"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-[18px] h-[18px] rounded-full transition-transform ${
                  preferencias[campo] ? "translate-x-5 bg-on-primary" : "bg-fg-soft"
                }`}
              />
            </button>
          </div>
        ))}

        <div className="flex flex-wrap gap-3 pt-5 border-t border-fg/20">
          <Link to="/perfil" className={estiloDoLink}>
            <UserCog size={16} aria-hidden="true" />
            <span>Editar perfil</span>
          </Link>
          <Link to="/ajuda" className={estiloDoLink}>
            <HelpCircle size={16} aria-hidden="true" />
            <span>Ajuda</span>
          </Link>
          {getCurrentProfile()?.admin && (
            <Link to="/admin" className={estiloDoLink}>
              <ShieldCheck size={16} aria-hidden="true" />
              <span>Administração</span>
            </Link>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-danger/50 hover:bg-danger-soft/50 text-danger font-bold text-sm transition cursor-pointer"
          >
            <LogOut size={16} aria-hidden="true" />
            <span>Sair da conta</span>
          </button>
        </div>
      </div>
    </div>
  );
}
