"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to AIBAT</h1>
        <p className="mb-4">Please login to continue.</p>
        <Link href="/login" className="underline text-blue-500">Go to Login</Link>
      </div>
    </main>
  );
}
