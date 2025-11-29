"use client";

import { useRouter } from "next/navigation";

export default function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black ">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="border-2 border-blue-500 p-8">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Login Page
          </h1>
          <form className="mt-4 flex flex-col gap-4">
            <input
              type="text"
              placeholder="Username"
              className="border border-gray-300 p-2 rounded"
            />
            <input
              type="password"
              placeholder="Password"
              className="border border-gray-300 p-2 rounded"
            />
          </form>
        </div>
      </main>
    </div>
  );
}
