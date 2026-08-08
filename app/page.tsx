import Link from "next/link";
export default function Home() {
  return (
    <main className="min-h-screen bg-[#E8F3E8] text-[#2f2f2f]">

      <section className="mx-auto flex max-w-6xl flex-col items-center px-6 py-24 text-center md:py-32">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#527A5A]">
          Childcare support from real experience
        </p>

        <h1 className="max-w-4xl text-5xl font-bold leading-tight md:text-7xl">
          Helping parents feel more confident about childcare
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-[#666]">
          Practical advice, helpful resources and simple tools from an
          experienced nanny.
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <a
            href="#resources"
            className="rounded-full bg-[#2f2f2f] px-7 py-3 font-semibold text-white transition hover:opacity-85"
          >
            Explore resources
          </a>

          <Link
  href="/about"
  className="rounded-full border border-[#2f2f2f] px-7 py-3 font-semibold transition hover:bg-[#2f2f2f] hover:text-white"
>
  Meet Anna
</Link>
        </div>
      </section>

      <section
        id="about"
        className="mx-auto max-w-5xl px-6 py-20 md:px-12"
      >
        <div className="rounded-3xl bg-white p-8 shadow-sm md:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#527A5A]">
            About
          </p>

          <h2 className="mt-3 text-3xl font-bold md:text-4xl">
            Hi, I&apos;m Anna
          </h2>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#666]">
            I&apos;m a nanny with hands-on experience supporting children and
            families. NannyAnna is a place for practical childcare advice,
            useful templates and straightforward support for everyday family
            life.
          </p>
        </div>
      </section>

      <section
        id="resources"
        className="mx-auto max-w-6xl px-6 py-20 md:px-12"
      >
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#527A5A]">
            Resources
          </p>

          <h2 className="mt-3 text-3xl font-bold md:text-4xl">
            Useful tools for everyday childcare
          </h2>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-7 shadow-sm">
            <h3 className="text-xl font-bold">Daily routines</h3>
            <p className="mt-3 leading-7 text-[#666]">
              Simple timetable and routine templates for different ages.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-7 shadow-sm">
            <h3 className="text-xl font-bold">Childcare advice</h3>
            <p className="mt-3 leading-7 text-[#666]">
              Practical guidance on common childcare questions and challenges.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-7 shadow-sm">
            <h3 className="text-xl font-bold">Parent support</h3>
            <p className="mt-3 leading-7 text-[#666]">
              Personalised one-to-one advice sessions will be available soon.
            </p>
          </div>
        </div>
      </section>

      <footer
        id="contact"
        className="mt-20 border-t border-black/10 px-6 py-8 text-center text-sm text-[#666]"
      >
        © 2026 NannyAnna
      </footer>
    </main>
  );
}