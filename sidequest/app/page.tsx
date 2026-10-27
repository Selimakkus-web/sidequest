import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Anasayfa() {
  const supabase = await createClient();
  const { data: gorevler } = await supabase.from("quests").select("id,title,category,deadline")
    .eq("visibility", "public").eq("status", "open").order("created_at", { ascending: false }).limit(4);
  return (
    <>
      <section className="pt-16 pb-12 sm:pt-24">
        <h1 className="max-w-2xl text-4xl font-semibold sm:text-5xl">Bitirebileceğin kadar küçük bir hedef seç. Bu hafta bitir.</h1>
        <p className="mt-5 max-w-xl text-lg text-soluk">SideQuest’te küçük görevler oluşturur, başkalarının görevlerine katılır ve ilerlemeni not ederek takip edersin.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/kesfet" className="rounded bg-orman px-5 py-2.5 text-zemin">Görevleri keşfet</Link>
          <Link href="/kayit" className="rounded border border-orman px-5 py-2.5 text-orman">Hesap oluştur</Link>
        </div>
      </section>
      <section className="border-t border-cizgi py-10">
        <h2 className="text-2xl font-semibold">Açık görevler</h2>
        {gorevler?.length ? (
          <ul className="mt-4 divide-y divide-cizgi">
            {gorevler.map((g) => (
              <li key={g.id}><Link href={`/gorev/${g.id}`} className="flex justify-between gap-4 py-3 hover:text-orman"><span>{g.title}</span><span className="text-sm text-soluk">{g.category}</span></Link></li>
            ))}
          </ul>
        ) : (
          <div className="mt-4 rounded border border-cizgi bg-yuzey p-5">
            <p className="text-sm text-soluk">Henüz herkese açık görev yok. Aşağıdaki yalnızca örnektir.</p>
            <p className="mt-2 font-medium">Örnek: Yedi gün içinde ilk web sitesini yayımla</p>
          </div>
        )}
      </section>
      <section className="border-t border-cizgi py-10">
        <h2 className="text-2xl font-semibold">Nasıl işler?</h2>
        <ol className="mt-4 max-w-xl list-decimal space-y-2 pl-5">
          <li>Bir görev oluştur ya da var olan bir göreve katıl.</li>
          <li>Aşamaları tamamladıkça işaretle, notlarını paylaş.</li>
          <li>Hazır olduğunda katılımını tamamlandı olarak kapat.</li>
        </ol>
      </section>
    </>
  );
}
