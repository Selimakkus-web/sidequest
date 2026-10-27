"use client";
import { useActionState } from "react";

type Sonuc = { hata?: string; bilgi?: string };
export function EylemFormu({ eylem, gizli, etiket, notAlani, ikincil }: {
  eylem: (s: Sonuc, f: FormData) => Promise<Sonuc>; gizli: Record<string, string>; etiket: string; notAlani?: string; ikincil?: boolean;
}) {
  const [d, git, bekliyor] = useActionState(eylem, {});
  return (
    <form action={git} className="space-y-2">
      {Object.entries(gizli).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {notAlani && (<><label htmlFor={`n-${gizli.id}`} className="block text-sm font-medium">{notAlani}</label>
        <textarea id={`n-${gizli.id}`} name="note" rows={4} className="w-full rounded border border-cizgi bg-white px-3 py-2" /></>)}
      <button disabled={bekliyor} className={`rounded px-4 py-2 disabled:opacity-60 ${ikincil ? "border border-orman text-orman" : "bg-orman text-zemin"}`}>{bekliyor ? "Bekleyin…" : etiket}</button>
      {d.hata && <p role="alert" className="text-sm text-red-800">{d.hata}</p>}
      {d.bilgi && <p role="status" className="text-sm text-orman">{d.bilgi}</p>}
    </form>
  );
}
