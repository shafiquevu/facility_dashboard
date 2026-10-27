import Image from "next/image";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm">
        <Image src="/logo.png" alt="McGrath Facility Maintenance" width={640} height={123} priority className="mb-10 h-auto w-[210px]" />
        <h1 className="display text-[24px] font-semibold">Sign in</h1>
        <p className="mt-1 mb-6 text-[13px] text-graphite">Use the same account as the McGrath dashboard.</p>
        <Suspense>
          <Form searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function Form({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <LoginForm next={next && next.startsWith("/") && !next.startsWith("//") ? next : "/"} />;
}
