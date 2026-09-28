/**
 * トップページ。フェーズ3の P3-5 で「新着順の配列の一覧」に置き換える。
 */
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-10">
      <h1 className="text-2xl font-bold">分割キーボードの配列を共有しよう</h1>
      <p className="text-zinc-600">
        分割キーボードのキー配列と「なぜこの配置にしたか」を投稿して、X(旧Twitter)で共有できるサイトです。
        まずは Keychron Orca echo に対応しています。
      </p>
      <p className="text-sm text-zinc-500">配列の一覧は準備中です。</p>
    </main>
  );
}
