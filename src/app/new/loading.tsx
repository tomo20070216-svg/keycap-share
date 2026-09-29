/** エディタを開くまでの間に、すぐ表示する(押しても反応がないように見えないように) */
export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-8" aria-busy="true">
      <h1 className="text-2xl font-bold">配列を投稿する</h1>
      <p role="status" className="text-zinc-600">
        エディタを読み込んでいます…
      </p>
    </main>
  );
}
