"use client";

import Image from "next/image";
import Link from "next/link";

export default function VerifyRequestPage() {
  return (
    <div
      className="min-h-screen flex"
      style={{
        backgroundImage:
          "linear-gradient(to bottom right, rgba(183, 161, 202, 0.6), rgba(253, 238, 163, 0.3)), url('/illustration.png')",
        backgroundSize: "cover",
        backgroundPosition: "left center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center bg-white/0 p-8">
          <div className="flex justify-center mb-4">
            <Image src="/logo.png" alt="BookHaven" width={160} height={160} />
          </div>
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">
            Check your email
          </h1>
          <p className="mt-3 text-white/90">
            We sent you a magic link. Click it to finish signing in. If you
            don’t see an email, check your spam folder or try again.
          </p>
          <div className="mt-6">
            <Link
              href="/auth/signin"
              className="inline-block underline text-primary-200 hover:text-primary-100"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
