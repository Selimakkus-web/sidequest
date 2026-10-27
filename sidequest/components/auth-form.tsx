"use client";
import { useActionState } from "react";
import type { FormDurumu } from "@/app/giris/actions";

type Alan = { ad: string; etiket: string; tip?: string; otomatik?: string };

export function AuthForm({ eylem, alanlar, dugme, donus }: {
  eylem: (s: FormDurumu, f: FormData) => Promise<FormDurumu>; alanlar: Alan[]; dugme: string; donus?: string;
}) {
  const [durum, git, bekliyor] = useActionState(eylem, {});
  return (
    <form action={git} className="mt-6 space-y-4" noValidate>
      {donus && <input type="hidden" name="donus" value={donus} />}
      {alanlar.map((a) => {
        const hata = durum.alanHatalari?.[a.ad]?.[0];
        return (
          <div key={a.ad}>
            <label htmlFor={a.ad} className="block text-sm font-medium">{a.etiket}</label>
            <input id={a.ad} name={a.ad} type={a.tip ?? "text"} autoComplete={a.otomatik} aria-invalid={!!hata} aria-describedby={hata ? `${a.ad}-hata` : undefined}
              className="mt-1 w-full rounded border border-cizgi bg-white px-3 py-2" />
            {hata && <p id={`${a.ad}-hata`} className="mt-1 text-sm text-red-800">{hata}</p>}
          </div>
        );
      })}
      {durum.hata && <p role="alert" className="text-sm text-red-800">{durum.hata}</p>}
      {durum.bilgi && <p role="status" className="text-sm text-orman">{durum.bilgi}</p>}
      <button disabled={bekliyor} className="w-full rounded bg-orman px-4 py-2 text-zemin disabled:opacity-60">{bekliyor ? "Lütfen bekleyin…" : dugme}</button>
    </form>
  );
}
