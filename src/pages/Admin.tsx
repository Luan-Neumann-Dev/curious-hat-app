import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Ban, Search as SearchIcon, ShieldCheck, Trash2 } from "lucide-react";
import { Abas, PainelDaAba } from "../components/Abas";
import { useAnuncio } from "../hooks/useAnuncio";
import { mensagemDeErro } from "../lib/errors";
import { comPlural } from "../lib/plural";
import { carregarEstatisticas, definirBloqueio, listarUsuarios } from "../services/admin";
import {
  buscarHats,
  buscarRespostas,
  excluirHat,
  excluirResposta,
  listarHats,
} from "../services/hats";
import { getCurrentProfile } from "../services/session";
import type { EstatisticasDoAdmin, Post, Reply, UsuarioDoAdmin } from "../types";

type AbaDoAdmin = "hats" | "respostas" | "usuarios";

const ABAS: { id: AbaDoAdmin; rotulo: string; busca: string }[] = [
  { id: "hats", rotulo: "Hats", busca: "Buscar por texto, nome ou vulgo" },
  { id: "respostas", rotulo: "Respostas", busca: "Buscar por texto, nome ou vulgo" },
  { id: "usuarios", rotulo: "Usuários", busca: "Buscar por nome ou @" },
];

const ESPERA_AO_DIGITAR_MS = 300;

function formatarData(data: string): string {
  return new Date(data).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

/** Excluir pede um segundo clique, porque não dá para desfazer. */
function DeleteButton({ onConfirmar }: { onConfirmar: () => Promise<void> }) {
  const [confirmando, setConfirmando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  async function confirmar() {
    setExcluindo(true);
    try {
      await onConfirmar();
    } finally {
      setExcluindo(false);
      setConfirmando(false);
    }
  }

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-danger/50 text-danger hover:bg-danger-soft/50 text-xs font-bold transition cursor-pointer shrink-0"
      >
        <Trash2 size={13} aria-hidden="true" />
        <span>Excluir</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <button
        type="button"
        onClick={confirmar}
        disabled={excluindo}
        className="px-3 py-1 rounded-full bg-danger-solid hover:bg-danger-hover text-white text-xs font-bold transition cursor-pointer disabled:opacity-60 disabled:cursor-wait"
      >
        {excluindo ? "Excluindo..." : "Confirmar"}
      </button>
      <button
        type="button"
        onClick={() => setConfirmando(false)}
        disabled={excluindo}
        className="px-3 py-1 rounded-full border border-fg/40 text-fg text-xs font-bold transition cursor-pointer"
      >
        Cancelar
      </button>
    </div>
  );
}

function Autor({ item }: { item: Post | Reply }) {
  if (item.isAnonymous) {
    return <span className="font-bold text-anon">🎩 @{item.displayName}</span>;
  }
  return (
    <Link to={`/perfil/${item.authorId}`} className="font-bold text-fg hover:underline">
      {item.displayName}
    </Link>
  );
}

export function Admin() {
  const [eu] = useState(getCurrentProfile);
  const [aba, setAba] = useState<AbaDoAdmin>("hats");
  const [busca, setBusca] = useState("");
  const [totais, setTotais] = useState<EstatisticasDoAdmin | null>(null);
  const [hats, setHats] = useState<Post[]>([]);
  const [respostas, setRespostas] = useState<Reply[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioDoAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [alterando, setAlterando] = useState("");
  const [recargas, setRecargas] = useState(0);

  const termo = busca.trim();

  useEffect(() => {
    async function carregarTotais() {
      try {
        setTotais(await carregarEstatisticas());
      } catch (err) {
        setErro(mensagemDeErro(err));
      }
    }
    carregarTotais();
  }, [recargas]);

  useEffect(() => {
    // Ignora a resposta antiga se a pessoa trocar de aba ou continuar digitando
    let ativa = true;

    const espera = setTimeout(async () => {
      try {
        if (aba === "hats") {
          const lista = termo ? await buscarHats(termo) : await listarHats();
          if (ativa) setHats(lista);
        } else if (aba === "respostas") {
          const lista = await buscarRespostas(termo);
          if (ativa) setRespostas(lista);
        } else {
          const lista = await listarUsuarios(termo);
          if (ativa) setUsuarios(lista);
        }
      } catch (err) {
        if (ativa) setErro(mensagemDeErro(err));
      } finally {
        if (ativa) setLoading(false);
      }
    }, ESPERA_AO_DIGITAR_MS);

    return () => {
      ativa = false;
      clearTimeout(espera);
    };
  }, [aba, termo, recargas]);

  function trocarAba(nova: AbaDoAdmin) {
    setLoading(true);
    setErro("");
    setBusca("");
    setAba(nova);
  }

  function aoBuscar(valor: string) {
    setLoading(true);
    setBusca(valor);
  }

  async function executar(acao: () => Promise<void>) {
    try {
      setErro("");
      await acao();
      setRecargas((total) => total + 1);
    } catch (err) {
      setErro(mensagemDeErro(err));
    }
  }

  async function alternarBloqueio(usuario: UsuarioDoAdmin) {
    setAlterando(usuario.userId);
    await executar(() => definirBloqueio(usuario.userId, !usuario.bloqueado));
    setAlterando("");
  }

  const cartoes: { rotulo: string; valor: number | undefined }[] = [
    { rotulo: "Usuários", valor: totais?.usuarios },
    { rotulo: "Bloqueados", valor: totais?.bloqueados },
    { rotulo: "Hats ativos", valor: totais?.hats },
    { rotulo: "Hats anônimos", valor: totais?.hatsAnonimos },
    { rotulo: "Respostas", valor: totais?.respostas },
  ];

  const abaAtual = ABAS.find((item) => item.id === aba);
  const estiloDaLinha = "flex flex-wrap items-start justify-between gap-3 p-4 border-b border-fg/20";

  const totalDaAba = { hats: hats.length, respostas: respostas.length, usuarios: usuarios.length }[aba];
  let status = comPlural(totalDaAba, "resultado", "resultados");
  if (loading) status = "Carregando...";
  else if (erro) status = "";
  useAnuncio(status);

  return (
    <div>
      <div className="border-b border-fg/40 p-4 bg-app flex items-center gap-2">
        <ShieldCheck size={20} className="text-accent shrink-0" aria-hidden="true" />
        <h1 className="text-xl font-extrabold text-fg">Administração</h1>
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 p-4 border-b border-fg/30">
        {cartoes.map(({ rotulo, valor }) => (
          <div key={rotulo} className="border border-fg/30 rounded-xl bg-surface p-3 min-w-0">
            <dt className="text-xs text-muted">{rotulo}</dt>
            <dd className="text-2xl font-black text-fg">{valor ?? "–"}</dd>
          </div>
        ))}
      </dl>

      <Abas base="admin" rotulo="Área do painel" abas={ABAS} ativa={aba} onChange={trocarAba} />

      <PainelDaAba base="admin" ativa={aba}>
      <div className="p-4 border-b border-fg/30 relative">
        <label htmlFor="busca-admin" className="sr-only">{abaAtual?.busca}</label>
        <SearchIcon size={18} className="absolute left-7.5 top-7 text-accent" aria-hidden="true" />
        <input
          id="busca-admin"
          type="search"
          placeholder={abaAtual?.busca}
          value={busca}
          onChange={(e) => aoBuscar(e.target.value)}
          className="w-full bg-app border border-fg/60 text-fg pl-10 pr-4 py-2.5 rounded-full text-sm"
        />
      </div>

      {erro && (
        <div role="alert" className="m-4 p-3 border border-danger bg-danger-soft/70 text-fg text-sm rounded-xl">
          {erro}
        </div>
      )}

      {loading ? (
        <p className="p-10 text-center text-muted">Carregando...</p>
      ) : aba === "hats" ? (
        hats.length === 0 ? (
          !erro && <p className="p-10 text-center text-muted">Nenhum hat encontrado.</p>
        ) : (
          <ul>
            {hats.map((hat) => (
              <li key={hat.id} className={estiloDaLinha}>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="text-xs mb-1">
                    <Autor item={hat} />
                    <span className="text-muted"> · {formatarData(hat.createdAt)}</span>
                    {hat.communityName && <span className="text-muted"> · {hat.communityName}</span>}
                  </p>
                  <Link to={`/fofoca/${hat.id}`} className="block text-fg-soft hover:underline [overflow-wrap:anywhere]">
                    {hat.content}
                  </Link>
                  <p className="text-xs text-muted mt-1">
                    {comPlural(hat.likes, "Fogo", "Fogos")} · {comPlural(hat.repliesCount, "resposta", "respostas")}
                  </p>
                </div>
                <DeleteButton onConfirmar={() => executar(() => excluirHat(hat.id))} />
              </li>
            ))}
          </ul>
        )
      ) : aba === "respostas" ? (
        respostas.length === 0 ? (
          !erro && <p className="p-10 text-center text-muted">Nenhuma resposta encontrada.</p>
        ) : (
          <ul>
            {respostas.map((resposta) => (
              <li key={resposta.id} className={estiloDaLinha}>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="text-xs mb-1">
                    <Autor item={resposta} />
                    <span className="text-muted"> · {formatarData(resposta.createdAt)}</span>
                  </p>
                  <Link to={`/fofoca/${resposta.hatId}`} className="block text-fg-soft hover:underline [overflow-wrap:anywhere]">
                    {resposta.content}
                  </Link>
                </div>
                <DeleteButton onConfirmar={() => executar(() => excluirResposta(resposta.id))} />
              </li>
            ))}
          </ul>
        )
      ) : usuarios.length === 0 ? (
        !erro && <p className="p-10 text-center text-muted">Nenhum usuário encontrado.</p>
      ) : (
        <ul>
          {usuarios.map((usuario) => (
            <li key={usuario.userId} className={`${estiloDaLinha} items-center`}>
              <div className="min-w-0 flex-1">
                <Link to={`/perfil/${usuario.userId}`} className="block text-sm font-bold text-fg truncate hover:underline">
                  {usuario.accountName}
                </Link>
                <p className="text-xs text-muted truncate">
                  @{usuario.publicHandle} · desde {usuario.joinedAt}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {usuario.admin && (
                    <span className="text-[11px] font-bold text-accent border border-accent/50 rounded-full px-2">Administrador</span>
                  )}
                  {usuario.bloqueado && (
                    <span className="text-[11px] font-bold text-danger border border-danger/50 rounded-full px-2">Bloqueado</span>
                  )}
                </div>
              </div>
              {usuario.userId !== eu?.userId && (
                <button
                  type="button"
                  onClick={() => alternarBloqueio(usuario)}
                  disabled={alterando === usuario.userId}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer shrink-0 disabled:opacity-60 disabled:cursor-wait border ${
                    usuario.bloqueado
                      ? "border-fg/50 text-fg hover:bg-raised"
                      : "border-danger/50 text-danger hover:bg-danger-soft/50"
                  }`}
                >
                  <Ban size={13} aria-hidden="true" />
                  <span>{usuario.bloqueado ? "Desbloquear" : "Bloquear"}</span>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      </PainelDaAba>
    </div>
  );
}
