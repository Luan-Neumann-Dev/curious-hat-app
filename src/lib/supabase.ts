import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const chavePublica = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!url || !chavePublica) {
  throw new Error(
    "Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY. Veja o arquivo .env.example."
  );
}

export const supabase = createClient(url, chavePublica);
