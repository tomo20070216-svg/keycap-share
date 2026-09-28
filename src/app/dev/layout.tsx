import { assertDevPagesEnabled } from "@/lib/dev-pages";

/** /dev 以下の開発用ページは、本番(VERCEL_ENV=production)では404にする */
export default function DevLayout({ children }: LayoutProps<"/dev">) {
  assertDevPagesEnabled();
  return children;
}
