"use client";
import { signOut } from "firebase/auth";
import { authClient } from "@/lib/firebase-client";

export default function Topbar() {
  return (
    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b p-4 flex items-center justify-between">
      <div className="font-semibold">SPST — Area Riservata</div>
      <button
        onClick={() => signOut(authClient())}
        className="text-sm px-3 py-2 rounded-lg border hover:bg-gray-50"
      >
        Logout
      </button>
    </div>
  );
}
