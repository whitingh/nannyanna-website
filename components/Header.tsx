import Link from "next/link";
import { Cormorant_Garamond } from "next/font/google";

const logoFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["600", "700"],
});

export default function Header() {
  return (
    <header className="relative z-50 bg-[#FFFEFA] shadow-[0_5px_18px_rgba(0,0,0,0.12)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-10 md:py-6">
        
        {/* NannyAnna logo */}
        <Link
          href="/"
          className={`${logoFont.className} whitespace-nowrap text-4xl font-bold tracking-tight md:text-5xl`}
        >
          <span
  className="text-[#B08D57]"
  style={{
    textShadow: "0 1px 2px rgba(0,0,0,0.15)",
  }}
>
  Nanny
</span>

<span
  className="text-[#527A5A]"
  style={{
    textShadow: "0 1px 2px rgba(0,0,0,0.15)",
  }}
>
  Anna
</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/about"
            className="font-medium text-[#344C3D] transition hover:text-[#527A5A]"
          >
            About
          </Link>

          <Link
            href="/advice"
            className="font-medium text-[#344C3D] transition hover:text-[#527A5A]"
          >
            Advice
          </Link>

          <Link
            href="/resources"
            className="font-medium text-[#344C3D] transition hover:text-[#527A5A]"
          >
            Resources
          </Link>

          <Link
            href="/contact"
            className="font-medium text-[#344C3D] transition hover:text-[#527A5A]"
          >
            Contact
          </Link>

          <Link
  href="/book"
  className="rounded-full bg-[#527A5A] px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-[#45694D] hover:shadow-md"
>
  Book a Session
</Link>
        </nav>
      </div>
    </header>
  );
}