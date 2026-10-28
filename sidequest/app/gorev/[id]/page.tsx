import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EylemFormu } from "@/components/eylem-formu";
import { katil, ayril, tamamla, basvur, karar } from "./actions";

type Gorev = { id: string; title: string; description: string; category: string; visibility: string; status: string; join_mode: string;
  deadline: string | null; max_participants: number | null; creator_id: string; profiles: { display_name: string; username: string } | null };
type Basvuru = { id: string; note: string; profiles: { display_name: string; username: string } | null };

export default async function GorevSayfasi({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ davet?: string }> }) {
  const { id } = await params;
  const { davet = "" } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("quests").select("*, profiles!creator_id(display_name,username)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const g = data as unknown as Gorev;
  const { data: { user } } = await supabase.auth.getUser();
  const sahibi = user?.id === g.creator_id;

  const { count } = await supabase.from("quest_members").select("*", { count: "exact", head: true }).eq("quest_id", id).neq("status", "left");
  const { data: uyelik } = user ? await supabase.from("quest_members").select("status").eq("quest_id", id).eq("user_id", user.id).maybeSingle() : { data: null };
  const { data: basvurum } = user ? await supabase.from("quest_applications").select("status").eq("quest_id", id).eq("user_id", user.id).maybeSingle() : { data: null };
  const bekleyenler = sahibi ? ((await supabase.from("quest_applications").select("id,note,profiles!user_id(display_name,username)").eq("quest_id", id).eq("status", "pending")).data ?? []) as unknown as Basvuru[] : [];
  const davetKodu = sahibi && g.visibility === "private" ? (await supabase.from("quest_invites").select("code").eq("quest_id", id).maybeSingle()).data?.code : null;
  const aktif = uyelik?.status === "active";

  return (
    <article className="pt-12">
      <p className="text-sm text-soluk">{g.category} · {g.join_mode === "application" ? "Başvuruyla katılım" : "Herkese açık katılım"}{g.visibility === "private" ? " · Özel" : ""}</p>
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{g.title}</h1>
      <p className="mt-2 text-sm text-soluk">
        Oluşturan: {g.profiles ? <Link href={`/profil/${g.profiles.username}`} className="underline">{g.profiles.display_name}</Link> : "—"} · {count ?? 0} katılımcı{g.max_participants ? ` / ${g.max_participants}` : ""}
        {g.deadline ? ` · Son tarih: ${new Date(g.deadline).toLocaleDateString("tr-TR")}` : ""}
      </p>
      <p className="mt-6 max-w-2xl whitespace-pre-line">{g.description}</p>

      <section className="mt-8 max-w-md border-t border-cizgi pt-6">
        {!user ? <p><Link href={`/giris?donus=/gorev/${id}`} className="text-orman underline">Giriş yapın</Link>; katılmak için hesabınız olmalı.</p>
        : g.status !== "open" ? <p className="text-soluk">Bu görev kapalı.</p>
        : aktif ? (<div className="space-y-3">
            <p>Bu görevin katılımcısısınız.</p>
            <EylemFormu eylem={tamamla} gizli={{ id }} etiket="Katılımımı tamamlandı say" />
            {!sahibi && <EylemFormu eylem={ayril} gizli={{ id }} etiket="Görevden ayrıl" ikincil />}</div>)
        : uyelik?.status === "completed" ? <p>Bu görevi tamamladınız.</p>
        : g.join_mode === "application" && !sahibi ? (
            basvurum && basvurum.status !== "withdrawn" ? <p>Başvuru durumunuz: {({ pending: "bekliyor", approved: "onaylandı", rejected: "reddedildi" } as Record<string, string>)[basvurum.status]}.</p>
            : <EylemFormu eylem={basvur} gizli={{ id, code: davet }} etiket="Başvur" notAlani="Neden katılmak istiyorsunuz, nasıl katkı verebilirsiniz?" />)
        : <EylemFormu eylem={katil} gizli={{ id, code: davet }} etiket="Göreve katıl" />}
      </section>

      {sahibi && davetKodu && (<p className="mt-6 text-sm">Davet bağlantısı: <code className="break-all">/gorev/{id}?davet={davetKodu}</code></p>)}

      {sahibi && (<section className="mt-10 max-w-xl border-t border-cizgi pt-6">
        <h2 className="text-xl font-semibold">Bekleyen başvurular</h2>
        {bekleyenler.length === 0 ? <p className="mt-2 text-soluk">Bekleyen başvuru yok.</p> : (
          <ul className="mt-4 space-y-5">{bekleyenler.map((b) => (
            <li key={b.id}>
              <p className="font-medium">{b.profiles ? <Link href={`/profil/${b.profiles.username}`} className="underline">{b.profiles.display_name}</Link> : "Kullanıcı"}</p>
              <p className="mt-1 whitespace-pre-line text-sm">{b.note}</p>
              <div className="mt-2 flex gap-2">
                <EylemFormu eylem={karar} gizli={{ id: b.id, onay: "1" }} etiket="Onayla" />
                <EylemFormu eylem={karar} gizli={{ id: b.id, onay: "0" }} etiket="Reddet" ikincil />
              </div>
            </li>))}</ul>)}
      </section>)}
    </article>
  );
}
