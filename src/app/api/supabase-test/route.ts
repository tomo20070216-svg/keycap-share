import { NextResponse } from "next/server";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { ok: false, reason: "env vars missing" },
      { status: 500 }
    );
  }

  // ルート(/rest/v1/)はスキーマ全体を返すためSecret key専用になっている。
  // Publishable keyの有効性は、存在しないテーブル名への問い合わせで確認する。
  // 404 + PGRST205(テーブルが見つからない)ならキーは有効、401ならキーが無効。
  const res = await fetch(`${supabaseUrl}/rest/v1/_connection_check`, {
    headers: { apikey: supabaseAnonKey },
  });
  const body = await res.json().catch(() => null);
  const keyIsValid = res.status === 404 && body?.code === "PGRST205";

  return NextResponse.json({
    keyIsValid,
    status: res.status,
    urlHost: new URL(supabaseUrl).host,
  });
}
