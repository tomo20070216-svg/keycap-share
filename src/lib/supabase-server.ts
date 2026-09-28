import { createClient } from "@supabase/supabase-js";

/**
 * サーバー専用の Supabase クライアント(secret key を使うため RLS を通らない)。
 * 書き込み(配列の保存・編集)と、秘密キーのハッシュ照合にだけ使う。
 * ブラウザ側のコードから import してはいけない。
 */
export function createServerSupabase() {
  if (typeof window !== "undefined") {
    throw new Error("supabase-server はサーバー側でのみ使用できます");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY が .env.local に設定されていません"
    );
  }

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
