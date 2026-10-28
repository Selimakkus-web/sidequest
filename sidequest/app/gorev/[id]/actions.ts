"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { basvuruSemasi } from "@/lib/validation";

type Sonuc = { hata?: string; bilgi?: string };
const HATALAR: Record<string, string> = {
  oturum_gerekli: "Önce giriş yapmalısınız.", gorev_bulunamadi: "Görev bulunamadı.", gorev_kapali: "Bu görev kapalı.",
  gorev_dolu: "Görev dolu.", davet_gerekli: "Bu özel göreve davet bağlantısıyla girmelisiniz.",
  basvuru_gerekli: "Bu göreve yalnızca başvuruyla katılabilirsiniz.", basvuru_gerekmiyor: "Bu göreve doğrudan katılabilirsiniz.",
  basvuru_var: "Bu göreve zaten başvurdunuz.", basvuru_reddedildi: "Önceki başvurunuz reddedildi.",
  basvuru_karar_verilmis: "Bu başvuru zaten sonuçlandırılmış.", zaten_uye: "Zaten bu görevin katılımcısısınız.", yetkisiz: "Bu işlem için yetkiniz yok.",
};
const mesaj = (m?: string) => HATALAR[Object.keys(HATALAR).find((k) => m?.includes(k)) ?? ""] ?? "İşlem tamamlanamadı. Lütfen tekrar deneyin.";

async function cagir(fn: string, args: Record<string, unknown>, bilgi: string): Promise<Sonuc> {
  const supabase = await createClient();
  const { error } = await supabase.rpc(fn, args);
  if (error) return { hata: mesaj(error.message) };
  revalidatePath("/gorev/[id]", "page");
  return { bilgi };
}
const s = (fd: FormData, k: string) => String(fd.get(k) ?? "");

export async function katil(_: Sonuc, fd: FormData) { return cagir("join_quest", { p_quest: s(fd, "id"), p_code: s(fd, "code") || null }, "Göreve katıldınız."); }
export async function ayril(_: Sonuc, fd: FormData) { return cagir("leave_quest", { p_quest: s(fd, "id") }, "Görevden ayrıldınız."); }
export async function tamamla(_: Sonuc, fd: FormData) { return cagir("complete_quest", { p_quest: s(fd, "id") }, "Katılımınız tamamlandı olarak işaretlendi."); }
export async function basvur(_: Sonuc, fd: FormData): Promise<Sonuc> {
  const p = basvuruSemasi.safeParse({ note: fd.get("note") });
  if (!p.success) return { hata: p.error.issues[0].message };
  return cagir("apply_to_quest", { p_quest: s(fd, "id"), p_note: p.data.note, p_code: s(fd, "code") || null }, "Başvurunuz gönderildi.");
}
export async function karar(_: Sonuc, fd: FormData) { return cagir("decide_application", { p_app: s(fd, "id"), p_approve: s(fd, "onay") === "1" }, "Karar kaydedildi."); }

export async function sil(_: Sonuc, fd: FormData): Promise<Sonuc> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { hata: "Önce giriş yapmalısınız." };
  const { data, error } = await supabase.from("quests").delete().eq("id", s(fd, "id")).eq("creator_id", user.id).select("id");
  if (error || !data?.length) return { hata: "Görev silinemedi. Bu işlem için yetkiniz olmayabilir." };
  revalidatePath("/panel");
  revalidatePath("/kesfet");
  redirect("/panel");
}
