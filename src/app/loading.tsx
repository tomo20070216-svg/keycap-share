/** ページを切り替えている間に、すぐ表示する */
export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col px-4 py-8" aria-busy="true">
      <p role="status" className="text-zinc-600">
        読み込んでいます…
      </p>
    </main>
  );
}
