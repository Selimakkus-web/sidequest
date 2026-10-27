"use client";
import { useActionState } from "react";
import { gorevOlustur } from "@/app/gorev-olustur/actions";
import { KATEGORILER } from "@/lib/validation";

const girdi = "mt-1 w-full rounded border border-cizgi bg-white px-3 py-2";
export function GorevFormu() {
  const [d, git, bekliyor] = useActionState(gorevOlustur, {});
  const h = (k: string) => d.alanHatalari?.[k]?.[0];
  const Hata = ({ k }: { k: string }) => (h(k) ? <p className="mt-1 text-sm text-red-800">{h(k)}</p> : null);
  return (
    <form action={git} className="mt-6 max-w-xl space-y-5">
      <div><label htmlFor="title" className="text-sm font-medium">Başlık</label><input id="title" name="title" className={girdi} /><Hata k="title" /></div>
      <div><label htmlFor="description" className="text-sm font-medium">Açıklama</label><textarea id="description" name="description" rows={5} className={girdi} /><Hata k="description" /></div>
      <div><label htmlFor="category" className="text-sm font-medium">Kategori</label><select id="category" name="category" className={girdi}>{KATEGORILER.map((k) => <option key={k}>{k}</option>)}</select></div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div><label htmlFor="deadline" className="text-sm font-medium">Son tarih (isteğe bağlı)</label><input id="deadline" name="deadline" type="date" className={girdi} /></div>
        <div><label htmlFor="maxParticipants" className="text-sm font-medium">Katılımcı sınırı (isteğe bağlı)</label><input id="maxParticipants" name="maxParticipants" type="number" min={1} className={girdi} /><Hata k="maxParticipants" /></div>
        <div><label htmlFor="visibility" className="text-sm font-medium">Görünürlük</label><select id="visibility" name="visibility" className={girdi}><option value="public">Herkese açık</option><option value="private">Özel (davetle)</option></select></div>
        <div><label htmlFor="joinMode" className="text-sm font-medium">Katılım şekli</label><select id="joinMode" name="joinMode" className={girdi}><option value="open">Herkes katılabilir</option><option value="application">Başvuru ve onay gerekir</option></select></div>
      </div>
      <div><label htmlFor="milestones" className="text-sm font-medium">Aşamalar (isteğe bağlı, her satıra bir aşama)</label><textarea id="milestones" name="milestones" rows={4} className={girdi} /></div>
      {d.hata && <p role="alert" className="text-sm text-red-800">{d.hata}</p>}
      <button disabled={bekliyor} className="rounded bg-orman px-5 py-2.5 text-zemin disabled:opacity-60">{bekliyor ? "Oluşturuluyor…" : "Görevi oluştur"}</button>
    </form>
  );
}
