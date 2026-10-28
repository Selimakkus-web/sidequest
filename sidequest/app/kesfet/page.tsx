import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { KATEGORILER } from "@/lib/validation";

type Satir = { id: string; title: string; description: string; category: string; join_mode: string; deadline: string | null;
  profiles: { display_name: string } | null; quest_members: { count: number }[] };
const SAYFA = 20;

export default async function Kesfet({ searchParams }: { searchParams: Promise<{ q?: string; kategori?: string; sayfa?: string }> }) {
  const { q = "", kategori = "", sayfa = "1" } = await searchParams;
  const s = Math.max(1, parseInt(sayfa) || 1);
  const supabase = await createClient();
  let sorgu = supabase.from("quests").select("id,title,description,category,join_mode,deadline,profiles!creator_id(display_name),quest_members(count)")
    .eq("visibility", "public").eq("status", "open").order("created_at", { ascending: false }).range((s - 1) * SAYFA, s * SAYFA);
  const temiz = q.replace(/[%,()]/g, " ").trim();
  if (temiz) sorgu = sorgu.or(`title.ilike.%${temiz}%,description.ilike.%${temiz}%`);
  if ((KATEGORILER as readonly string[]).includes(kategori)) sorgu = sorgu.eq("category", kategori);
  const { data } = await sorgu;
  const liste = (data ?? []) as unknown as Satir[];
  const sonraki = liste.length > SAYFA;
  const gorunen = liste.slice(0, SAYFA);
  const href = (n: number) => {
    const p = new URLSearchParams();
    if (temiz) p.set("q", temiz);
    if (kategori) p.set("kategori", kategori);
    p.set("sayfa", String(n));
    return `/kesfet?${p}`;
  };
  return (
    <section className="pt-12">
      <h1 className="text-3xl font-semibold">Görevleri keşfet</h1>
      <form className="mt-6 flex flex-wrap gap-3" role="search">
        <label className="sr-only" htmlFor="q">Ara</label>
        <input id="q" name="q" defaultValue={q} placeholder="Görev ara" className="min-w-0 flex-1 rounded border border-cizgi bg-white px-3 py-2" />
        <label className="sr-only" htmlFor="kategori">Kategori</label>
        <select id="kategori" name="kategori" defaultValue={kategori} className="rounded border border-cizgi bg-white px-3 py-2">
          <option value="">Tüm kategoriler</option>{KATEGORILER.map((k) => <option key={k}>{k}</option>)}
        </select>
        <button className="rounded bg-orman px-4 py-2 text-zemin">Ara</button>
      </form>
      {gorunen.length === 0 ? (
        <div className="mt-10 rounded border border-cizgi bg-yuzey p-6">
          <p className="font-medium">Sonuç bulunamadı.</p>
          <p className="mt-1 text-sm text-soluk">Aramanızı değiştirin ya da <Link href="/gorev-olustur" className="text-orman underline">ilk görevi siz oluşturun</Link>.</p>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-cizgi border-y border-cizgi">
          {gorunen.map((g) => (
            <li key={g.id}><Link href={`/gorev/${g.id}`} className="block py-4 hover:bg-yuzey">
              <p className="font-medium">{g.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-soluk">{g.description}</p>
              <p className="mt-2 text-xs text-soluk">{g.category} · {g.profiles?.display_name ?? "—"} · {g.quest_members[0]?.count ?? 0} katılımcı{g.join_mode === "application" ? " · Başvuruyla" : ""}{g.deadline ? ` · ${new Date(g.deadline).toLocaleDateString("tr-TR")}` : ""}</p>
            </Link></li>))}
        </ul>
      )}
      <div className="mt-6 flex gap-4 text-sm">
        {s > 1 && <Link href={href(s - 1)} className="text-orman underline">Önceki</Link>}
        {sonraki && <Link href={href(s + 1)} className="text-orman underline">Sonraki</Link>}
      </div>
    </section>
  );
}
