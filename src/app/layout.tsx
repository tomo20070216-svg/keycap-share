import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, getSiteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: "分割キーボードのキー配列を投稿・閲覧して、X(旧Twitter)で共有できるサイトです。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <header className="border-b border-zinc-200">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-bold tracking-tight">
              {SITE_NAME}
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/" className="underline-offset-4 hover:underline">
                配列の一覧
              </Link>
              <Link href="/new" className="rounded-md bg-zinc-900 px-3 py-1.5 font-bold text-white hover:bg-zinc-700">
                配列を投稿する
              </Link>
            </nav>
          </div>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
