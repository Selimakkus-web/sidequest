import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Uyelik = { status: string; joined_at: string; quests: { id: string; title: string; category: string; deadline: string | null } | null };
type Olusturulan = { id: string; title: string; status: string; quest_applications: { count: number }[] };
type Basvuru = { quests: { id: string; title: string } | null };

const tarih = (d: string | null) => (d ? new Date(d).toLocaleDateString("tr-TR") : null);

export default async function Panel() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris?donus=/panel");

  const [profil, uyelikler, olusturulan, basvurular] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    supabase.from("quest_members").select("status,joined_at,quests(id,title,category,deadline)")
      .eq("user_id", user.id).in("status", ["active", "completed"]).order("joined_at", { ascending: false }),
    supabase.from("quests").select("id,title,status,quest_applications(count)")
      .eq("creator_id", user.id).neq("status", "removed").eq("quest_applications.status", "pending").order("created_at", { ascending: false }),
    supabase.from("quest_applications").select("quests(id,title)").eq("user_id", user.id).eq("status", "pending"),
  ]);

  const tumUyelikler = (uyelikler.data ?? []) as unknown as Uyelik[];
  const devamEden = tumUyelikler.filter((u) => u.status === "active" && u.quests);
  const tamamlanan = tumUyelikler.filter((u) => u.status === "completed").length;
  const benimkiler = (olusturulan.data ?? []) as unknown as Olusturulan[];
  const bekleyenBasvurularim = ((basvurular.data ?? []) as unknown as Basvuru[]).filter((b) => b.quests);
  const ad = profil.data?.display_name;

  return (
    <section className="pt-12">
      <h1 className="text-3xl font-semibold">{ad ? `Merhaba, ${ad}` : "Merhaba"}</h1>
      <p className="mt-2 text-soluk">
        {devamEden.length} devam eden görev · {tamamlanan} tamamlanan · {benimkiler.length} oluşturduğun görev
      </p>

      <div className="mt-10">
        <h2 className="text-xl font-semibold">Devam eden görevlerin</h2>
        {devamEden.length === 0 ? (
          <div className="mt-3 rounded border border-cizgi bg-yuzey p-5">
            <p className="text-sm text-soluk">Henüz katıldığın bir görev yok.</p>
            <Link href="/kesfet" className="mt-2 inline-block text-orman underline">Görevleri keşfet</Link>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-cizgi border-y border-cizgi">
            {devamEden.map((u) => (
              <li key={u.quests!.id}>
                <Link href={`/gorev/${u.quests!.id}`} className="block py-3 hover:bg-yuzey">
                  <p className="font-medium">{u.quests!.title}</p>
                  <p className="text-xs text-soluk">{u.quests!.category}{u.quests!.deadline ? ` · Son tarih: ${tarih(u.quests!.deadline)}` : ""}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">Oluşturduğun görevler</h2>
          <Link href="/gorev-olustur" className="text-sm text-orman underline">Yeni görev</Link>
        </div>
        {benimkiler.length === 0 ? (
          <p className="mt-3 text-sm text-soluk">Henüz görev oluşturmadın.</p>
        ) : (
          <ul className="mt-3 divide-y divide-cizgi border-y border-cizgi">
            {benimkiler.map((g) => {
              const bekleyen = g.quest_applications[0]?.count ?? 0;
              return (
                <li key={g.id}>
                  <Link href={`/gorev/${g.id}`} className="flex items-center justify-between gap-4 py-3 hover:bg-yuzey">
                    <span className="font-medium">{g.title}</span>
                    <span className="text-xs text-soluk">
                      {g.status === "closed" ? "Kapalı" : "Açık"}{bekleyen > 0 ? ` · ${bekleyen} bekleyen başvuru` : ""}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {bekleyenBasvurularim.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold">Yanıt bekleyen başvuruların</h2>
          <ul className="mt-3 divide-y divide-cizgi border-y border-cizgi">
            {bekleyenBasvurularim.map((b) => (
              <li key={b.quests!.id}>
                <Link href={`/gorev/${b.quests!.id}`} className="block py-3 hover:bg-yuzey">{b.quests!.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
