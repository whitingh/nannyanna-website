import Image from "next/image";

export default function About() {
  return (
    <main className="min-h-screen bg-[#E8F3E8] px-6 py-16 text-[#2f2f2f] md:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Intro */}
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#527A5A]">
              About
            </p>

            <h1 className="mt-3 text-5xl font-bold">
              Meet Anna
            </h1>

            <p className="mt-6 text-lg leading-8 text-[#5f675f]">
              I&apos;m Anna, a qualified Norland nanny and certified sleep
              consultant. I&apos;m hoping to help new parents through what can
              be a challenging time.
            </p>

            <p className="mt-5 text-lg leading-8 text-[#5f675f]">
              I want to support parents who find themselves with a new baby and
              aren&apos;t sure how to help them sleep through the night, or take
              naps long enough during the day to give you time to complete
              everyday tasks — or simply have some time for yourself.
            </p>
          </div>

          <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-3xl shadow-sm">
            <Image
              src="/images/swagmeister 2.jpg"
              alt="Anna from NannyAnna"
              fill
              className="object-cover object-top"
              priority
            />
          </div>
        </div>

        {/* Support sections */}
        <div className="mt-16 grid gap-8 md:grid-cols-2">
          <section className="rounded-3xl bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#527A5A]">
              How I can help
            </p>

            <p className="mt-4 leading-7 text-[#5f675f]">
              Maybe antenatal classes aren&apos;t running in your area, other
              classes aren&apos;t available to you, they&apos;re too expensive,
              you don&apos;t have the time, or they simply aren&apos;t tailored
              enough to your needs and what you&apos;re looking for help with.
            </p>

            <p className="mt-4 leading-7 text-[#5f675f]">
              I&apos;m here to offer a range of support, from giving you an idea
              of a basic routine to start following, all the way through to
              creating a bespoke plan for you and your baby.
            </p>

            <p className="mt-4 leading-7 text-[#5f675f]">
              I can help with sleeping through the night, establishing regular
              naps during the day, and navigating the stages of weaning, with
              the aim that by the time your baby is one, they are healthy,
              happy, and sleeping and eating well.
            </p>
          </section>

          <section className="rounded-3xl bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#527A5A]">
              Ongoing support
            </p>

            <p className="mt-4 leading-7 text-[#5f675f]">
              I can also offer ongoing support to give you reassurance, help you
              stay on track, and discuss any challenges that come your way.
            </p>

            <p className="mt-4 leading-7 text-[#5f675f]">
              Every baby is different when it comes to sleep and feeding, which
              is why my bespoke plans are tailored specifically to your baby and
              your family.
            </p>

            <p className="mt-4 leading-7 text-[#5f675f]">
              They take into account your lives, what works for you, and the
              techniques you would prefer to use.
            </p>
          </section>
        </div>

        {/* Guides */}
        <section className="mt-8 rounded-3xl bg-white p-8 shadow-sm md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#527A5A]">
            My approach
          </p>

          <p className="mt-4 leading-7 text-[#5f675f]">
            My guides are based on what I have found works through my
            experience as a nanny caring for newborns as well as their older
            siblings. The guides are more generalised, but through my
            experience, these routines have helped babies achieve a full night
            of sleep by six months old.
          </p>

          <p className="mt-4 leading-7 text-[#5f675f]">
            Every baby is different in terms of sleep and feeding, so bespoke
            plans are adapted to your own baby, your family life, what works for
            you, and the techniques you would prefer to use.
          </p>
        </section>
      </div>
    </main>
  );
}