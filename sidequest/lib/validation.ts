import { z } from "zod";

export const KATEGORILER = ["Yazılım", "Okuma", "Yazı", "Spor", "Müzik", "Öğrenme", "Diğer"] as const;

export const kayitSemasi = z.object({
  displayName: z.string().trim().min(1, "Görünen adınızı yazın.").max(60),
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,20}$/, "Kullanıcı adı 3–20 karakter olmalı; yalnızca harf, rakam ve alt çizgi kullanın."),
  email: z.string().trim().email("Geçerli bir e-posta adresi girin."),
  password: z.string().min(8, "Parola en az 8 karakter olmalı."),
});
export const girisSemasi = z.object({
  email: z.string().trim().email("Geçerli bir e-posta adresi girin."),
  password: z.string().min(1, "Parolanızı girin."),
});
export const gorevSemasi = z.object({
  title: z.string().trim().min(3, "Başlık en az 3 karakter olmalı.").max(120),
  description: z.string().trim().min(10, "Açıklama en az 10 karakter olmalı.").max(4000),
  category: z.enum(KATEGORILER),
  visibility: z.enum(["public", "private"]),
  joinMode: z.enum(["open", "application"]).default("open"),
  deadline: z.string().datetime().optional(),
  maxParticipants: z.coerce.number().int().positive().max(1000).optional(),
  milestones: z.array(z.string().trim().min(1).max(120)).max(20).default([]),
});
export type GorevGirdisi = z.infer<typeof gorevSemasi>;
export const basvuruSemasi = z.object({ note: z.string().trim().min(10, "Başvuru notu en az 10 karakter olmalı.").max(1000) });
