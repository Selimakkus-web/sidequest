import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { girisYap } from "./actions";

export default async function Giris({ searchParams }: { searchParams: Promise<{ donus?: string }> }) {
  const { donus } = await searchParams;
  return (
    <section className="mx-auto max-w-sm pt-16">
      <h1 className="text-3xl font-semibold">Giriş yap</h1>
      <AuthForm eylem={girisYap} donus={donus} dugme="Giriş yap" alanlar={[
        { ad: "email", etiket: "E-posta", tip: "email", otomatik: "email" },
        { ad: "password", etiket: "Parola", tip: "password", otomatik: "current-password" },
      ]} />
      <p className="mt-6 text-sm text-soluk">Hesabınız yok mu? <Link href="/kayit" className="text-orman underline">Kayıt olun</Link></p>
    </section>
  );
}
