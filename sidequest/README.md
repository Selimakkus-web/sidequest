# SideQuest

## Kurulum
1. Supabase'de SQL Editor'da sırayla çalıştırın: `supabase/migrations/0001_init.sql`, sonra `0002_basvuru.sql`.
2. `.env.example` -> `.env.local` (Supabase URL + anon anahtarı). Servis anahtarını tarayıcıya vermeyin.
3. `npm install && npm run dev`
4. Yönetici: `insert into admins (user_id) values ('<uuid>');`
5. Yayın: GitHub + Vercel, aynı ortam değişkenleri. Supabase > Auth > URL Configuration'a site adresini ekleyin.

## Durum (dürüst özet)
Yazıldı ama HENÜZ derlenmedi, tip/lint kontrolü ve test yapılmadı.
Var: tasarım değişkenleri, şema + RLS, giriş/kayıt, Keşfet, görev oluşturma, görev ayrıntısı, katılma/ayrılma/tamamlama, başvuru ve onay sistemi.
Eksik: aşama işaretleme ve ilerleme notları arayüzü, yorumlar, panel, görevlerim, bildirimler, profil, ayarlar, şifre sıfırlama, moderasyon, Storage, hız sınırı, mobil menü, seviye sistemi, testler.
Bilinen sınır: görev oluşturma tek işlemde değil (görev + aşamalar ayrı eklenir).
