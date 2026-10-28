"use client";
import { useActionState, useState } from "react";

type Sonuc = { hata?: string; bilgi?: string };

export function SilmeFormu({ eylem, id }: { eylem: (s: Sonuc, f: FormData) => Promise<Sonuc>; id: string }) {
  const [onay, setOnay] = useState(false);
  const [d, git, bekliyor] = useActionState(eylem, {});
  if (!onay) {
    return <button type="button" onClick={() => setOnay(true)} className="rounded border border-red-800 px-4 py-2 text-red-800">Görevi sil</button>;
  }
  return (
    <form action={git} role="alertdialog" aria-labelledby="sil-baslik" className="max-w-md rounded border border-red-800 p-4">
      <input type="hidden" name="id" value={id} />
      <p id="sil-baslik" className="font-medium">Bu görevi silmek istediğinize emin misiniz?</p>
      <p className="mt-1 text-sm text-soluk">Katılımcılar, ilerleme notları ve başvurular da silinir. Bu işlem geri alınamaz.</p>
      <div className="mt-3 flex gap-2">
        <button disabled={bekliyor} className="rounded bg-red-800 px-4 py-2 text-white disabled:opacity-60">{bekliyor ? "Siliniyor…" : "Evet, sil"}</button>
        <button type="button" onClick={() => setOnay(false)} className="rounded border border-cizgi px-4 py-2">Vazgeç</button>
      </div>
      {d.hata && <p role="alert" className="mt-2 text-sm text-red-800">{d.hata}</p>}
    </form>
  );
}
