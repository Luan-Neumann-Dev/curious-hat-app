import type { Post } from "../types";
import { HatButton } from "./HatButton";

interface ConfirmModalProps {
  post: Post | null;
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function ConfirmModal({ post, onCancel, onConfirm, isDeleting }: ConfirmModalProps) {
  if (!post) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titulo"
      className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50"
    >
      <div className="bg-app border-2 border-danger rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <h2 id="modal-titulo" className="text-xl font-bold text-fg mb-2">
          🔥 Queimar este hat?
        </h2>
        <p className="text-fg-soft text-sm mb-6 [overflow-wrap:anywhere]">
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
