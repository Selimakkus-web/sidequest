import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { kayitOl } from "../giris/actions";

export default function Kayit() {
  return (
    <section className="mx-auto max-w-sm pt-16">
      <h1 className="text-3xl font-semibold">Hesap oluştur</h1>
      <AuthForm eylem={kayitOl} dugme="Hesap oluştur" alanlar={[
        { ad: "displayName", etiket: "Görünen ad", otomatik: "name" },
        { ad: "username", etiket: "Kullanıcı adı", otomatik: "username" },
        { ad: "email", etiket: "E-posta", tip: "email", otomatik: "email" },
        { ad: "password", etiket: "Parola (en az 8 karakter)", tip: "password", otomatik: "new-password" },
      ]} />
      <p className="mt-6 text-sm text-soluk">Zaten üye misiniz? <Link href="/giris" className="text-orman underline">Giriş yapın</Link></p>
    </section>
  );
}
