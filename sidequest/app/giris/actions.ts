"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { girisSemasi, kayitSemasi } from "@/lib/validation";

export type FormDurumu = { hata?: string; alanHatalari?: Record<string, string[] | undefined>; bilgi?: string };

function guvenliYol(yol: FormDataEntryValue | null) {
  return typeof yol === "string" && yol.startsWith("/") && !yol.startsWith("//") ? yol : "/panel";
}

export async function girisYap(_: FormDurumu, fd: FormData): Promise<FormDurumu> {
  const p = girisSemasi.safeParse(Object.fromEntries(fd));
  if (!p.success) return { alanHatalari: p.error.flatten().fieldErrors };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(p.data);
  if (error) return { hata: error.message.includes("Email not confirmed") ? "E-posta adresiniz henüz doğrulanmadı. Gelen kutunuzdaki bağlantıya tıklayın." : "E-posta veya parola hatalı." };
  redirect(guvenliYol(fd.get("donus")));
}

export async function kayitOl(_: FormDurumu, fd: FormData): Promise<FormDurumu> {
  const p = kayitSemasi.safeParse(Object.fromEntries(fd));
  if (!p.success) return { alanHatalari: p.error.flatten().fieldErrors };
  const supabase = await createClient();
  const { data: var_ } = await supabase.from("profiles").select("id").eq("username", p.data.username).maybeSingle();
  if (var_) return { alanHatalari: { username: ["Bu kullanıcı adı alınmış. Başka bir ad deneyin."] } };
  const { data, error } = await supabase.auth.signUp({
    email: p.data.email, password: p.data.password,
    options: { data: { username: p.data.username, display_name: p.data.displayName }, emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/panel` },
  });
  if (error) return { hata: "Hesap oluşturulamadı. Bilgilerinizi kontrol edip tekrar deneyin." };
  if (!data.session) return { bilgi: "Hesabınız oluşturuldu. E-postanıza gönderilen bağlantıyla adresinizi doğrulayın." };
  redirect("/panel");
}

export async function cikisYap() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
