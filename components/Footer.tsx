"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

if (pathname.startsWith("/admin")) {
  return null;
}
  return (
    <footer className="border-t border-black/10 px-6 py-4 text-center text-xs text-[#666]">
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        <Link href="/disclaimer" className="transition hover:text-black">
          Disclaimer
        </Link>

        <Link href="/privacy" className="transition hover:text-black">
          Privacy Policy
        </Link>

        <Link href="/terms" className="transition hover:text-black">
          Terms &amp; Conditions
        </Link>

        <Link href="/cookies" className="transition hover:text-black">
          Cookie Policy
        </Link>
      </div>

      <p className="mt-2">
        © {new Date().getFullYear()} NannyAnna
      </p>
    </footer>
  );
}