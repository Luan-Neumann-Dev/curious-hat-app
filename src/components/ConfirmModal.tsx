import { useEffect, useRef } from "react";
import type { KeyboardEvent } from "react";
import type { Post } from "../types";
import { HatButton } from "./HatButton";

interface ConfirmModalProps {
  post: Post | null;
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function ConfirmModal({ post, ...props }: ConfirmModalProps) {
  if (!post) return null;
  return <Dialogo post={post} {...props} />;
}

function Dialogo({ post, onCancel, onConfirm, isDeleting }: ConfirmModalProps & { post: Post }) {
  const dialogoRef = useRef<HTMLDivElement>(null);

  // Abre com o foco em "Cancelar", a opção segura, e devolve o foco ao fechar.
  useEffect(() => {
    const focoAnterior = document.activeElement;
    dialogoRef.current?.querySelector("button")?.focus();

    return () => {
      if (focoAnterior instanceof HTMLElement && focoAnterior.isConnected) {
        focoAnterior.focus();
      } else {
        // O botão que abriu o modal sumiu junto com o hat queimado
        document.getElementById("conteudo")?.focus({ preventScroll: true });
      }
    };
  }, []);

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      if (!isDeleting) onCancel();
      return;
    }
    if (e.key !== "Tab") return;

    // Mantém o Tab dentro do modal
    const botoes = dialogoRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
    if (!botoes?.length) return;
    const primeiro = botoes[0];
    const ultimo = botoes[botoes.length - 1];
    const naPonta = e.shiftKey
      ? document.activeElement === primeiro || document.activeElement === dialogoRef.current
      : document.activeElement === ultimo;
    if (naPonta) {
      e.preventDefault();
      (e.shiftKey ? ultimo : primeiro).focus();
    }
  }

  return (
    <div
      ref={dialogoRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titulo"
      aria-describedby="modal-descricao"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50"
    >
      <div className="bg-app border-2 border-danger rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <h2 id="modal-titulo" className="text-xl font-bold text-fg mb-2">
          🔥 Queimar este hat?
        </h2>
        <p id="modal-descricao" className="text-fg-soft text-sm mb-6 [overflow-wrap:anywhere]">
          Você está prestes a destruir o hat <strong className="text-accent">"{post.title || post.content.slice(0, 80)}"</strong>. Essa ação não pode ser desfeita!
        </p>

        <div className="flex justify-end gap-3">
          <HatButton variant="outline" onClick={onCancel} disabled={isDeleting}>
            Cancelar
          </HatButton>
          <HatButton variant="red" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? "Queimando..." : "Sim, Queimar Agora"}
          </HatButton>
        </div>
      </div>
    </div>
  );
}
