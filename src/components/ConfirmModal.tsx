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
      <div className="bg-black border-2 border-red-500 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <h2 id="modal-titulo" className="text-xl font-bold text-white mb-2">
          🔥 Queimar este segredo?
        </h2>
        <p className="text-zinc-200 text-sm mb-6">
          Você está prestes a destruir a fofoca <strong className="text-purple-400">"{post.title}"</strong> antes do tempo acabar. Essa ação não pode ser desfeita!
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
