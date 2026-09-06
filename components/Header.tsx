"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="relative z-50 bg-[#FFFEFA] shadow-[0_5px_18px_rgba(0,0,0,0.12)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 md:px-10 lg:py-3">

        {/* Logo */}
          <Link
            href="/"
            className="block shrink-0"
            onClick={() => setMenuOpen(false)}
          >
            <Image
              src="/images/NannyAnna logo.png"
              alt="NannyAnna"
              width={420}
              height={140}
              priority
              className="h-[110px] w-auto object-contain lg:h-[130px]"
            />
          </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-8 lg:flex">
          <Link
            href="/about"
            className="text-xl font-semibold text-[#344C3D] transition hover:text-[#527A5A]"
          >
            About
          </Link>

          <Link
            href="/advice"
            className="text-xl font-semibold text-[#344C3D] transition hover:text-[#527A5A]"
          >
            Advice
          </Link>

          <Link
            href="/resources"
            className="text-xl font-semibold text-[#344C3D] transition hover:text-[#527A5A]"
          >
            Resources
          </Link>

          <Link
            href="/contact"
            className="text-xl font-semibold text-[#344C3D] transition hover:text-[#527A5A]"
          >
            Contact
          </Link>

          <Link
            href="/book"
            className="rounded-full bg-[#527A5A] px-7 py-3.5 text-lg font-semibold text-white shadow-sm transition hover:bg-[#45694D] hover:shadow-md"
          >
            Book a Session
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[#527A5A]/20 text-[#527A5A] lg:hidden"
          aria-label="Open navigation menu"
          aria-expanded={menuOpen}
        >
          <div className="space-y-1.5">
            <span className="block h-0.5 w-5 bg-[#527A5A]" />
            <span className="block h-0.5 w-5 bg-[#527A5A]" />
            <span className="block h-0.5 w-5 bg-[#527A5A]" />
          </div>
        </button>
      </div>

      {/* Mobile navigation */}
      {menuOpen && (
        <nav className="border-t border-black/10 bg-[#FFFEFA] px-6 pb-6 pt-4 lg:hidden">
          <div className="flex flex-col gap-2">
            <Link
              href="/about"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-4 py-3 font-medium text-[#344C3D] transition hover:bg-[#E8F3E8]"
            >
              About
            </Link>

            <Link
              href="/advice"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-4 py-3 font-medium text-[#344C3D] transition hover:bg-[#E8F3E8]"
            >
              Advice
            </Link>

            <Link
              href="/resources"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-4 py-3 font-medium text-[#344C3D] transition hover:bg-[#E8F3E8]"
            >
              Resources
            </Link>

            <Link
              href="/contact"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-4 py-3 font-medium text-[#344C3D] transition hover:bg-[#E8F3E8]"
            >
              Contact
            </Link>

            <Link
              href="/book"
              onClick={() => setMenuOpen(false)}
              className="mt-2 rounded-full bg-[#527A5A] px-6 py-3 text-center font-semibold text-white"
            >
              Book a Session
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}