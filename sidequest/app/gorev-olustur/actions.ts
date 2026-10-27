"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { gorevSemasi } from "@/lib/validation";
import type { FormDurumu } from "@/app/giris/actions";

export async function gorevOlustur(_: FormDurumu, fd: FormData): Promise<FormDurumu> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris?donus=/gorev-olustur");
  const dl = String(fd.get("deadline") ?? "");
  const p = gorevSemasi.safeParse({
    title: fd.get("title"), description: fd.get("description"), category: fd.get("category"),
    visibility: fd.get("visibility"), joinMode: fd.get("joinMode"),
    deadline: dl ? new Date(dl).toISOString() : undefined,
    maxParticipants: fd.get("maxParticipants") || undefined,
    milestones: String(fd.get("milestones") ?? "").split("\n").map((x) => x.trim()).filter(Boolean),
  });
  if (!p.success) return { alanHatalari: p.error.flatten().fieldErrors };
  const v = p.data;
  const { data: q, error } = await supabase.from("quests").insert({
    creator_id: user.id, title: v.title, description: v.description, category: v.category, visibility: v.visibility,
    join_mode: v.joinMode, deadline: v.deadline ?? null, max_participants: v.maxParticipants ?? null,
  }).select("id").single();
  if (error || !q) return { hata: "Görev oluşturulamadı. Lütfen tekrar deneyin." };
  if (v.milestones.length) await supabase.from("quest_milestones").insert(v.milestones.map((title, i) => ({ quest_id: q.id, title, position: i + 1 })));
  if (v.visibility === "private") await supabase.from("quest_invites").insert({ quest_id: q.id });
  redirect(`/gorev/${q.id}`);
}
