import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cikisYap } from "@/app/giris/actions";

export async function UstMenu() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <header className="border-b border-cizgi">
      <nav aria-label="Ana gezinme" className="mx-auto flex max-w-5xl items-center gap-5 px-5 py-4 text-sm">
        <Link href="/" className="font-baslik text-xl font-semibold text-orman">SideQuest</Link>
        <Link href="/kesfet" className="hover:text-orman">Keşfet</Link>
        <div className="ml-auto flex items-center gap-4">
          {user ? (
            <>
              <Link href="/gorev-olustur" className="hover:text-orman">Görev oluştur</Link>
              <Link href="/panel" className="hover:text-orman">Panelim</Link>
              <form action={cikisYap}><button className="text-soluk hover:text-orman">Çıkış yap</button></form>
            </>
          ) : (
            <>
              <Link href="/giris" className="hover:text-orman">Giriş yap</Link>
              <Link href="/kayit" className="rounded bg-orman px-3 py-1.5 text-zemin hover:opacity-90">Kayıt ol</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
