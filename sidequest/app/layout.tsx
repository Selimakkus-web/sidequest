import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { UstMenu } from "@/components/ust-menu";

const baslik = Fraunces({ subsets: ["latin", "latin-ext"], variable: "--font-baslik" });
const govde = Source_Sans_3({ subsets: ["latin", "latin-ext"], variable: "--font-govde" });

export const metadata: Metadata = { title: "SideQuest", description: "Küçük adımlar. Gerçek ilerleme." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${baslik.variable} ${govde.variable}`}>
      <body>
        <UstMenu />
        <main className="mx-auto max-w-5xl px-5 pb-20">{children}</main>
        <footer className="border-t border-cizgi">
          <div className="mx-auto flex max-w-5xl flex-wrap gap-x-6 gap-y-2 px-5 py-6 text-sm text-soluk">
            <a href="/kesfet" className="hover:text-orman">Keşfet</a>
            <a href="/giris" className="hover:text-orman">Giriş yap</a>
            <a href="/kayit" className="hover:text-orman">Kayıt ol</a>
            <span className="ml-auto">SideQuest: Küçük adımlar. Gerçek ilerleme.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
