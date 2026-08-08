import Image from "next/image";

export default function About() {
  return (
    <main className="min-h-screen bg-[#E8F3E8] px-6 py-16 text-[#2f2f2f] md:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
        
        {/* Text */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#527A5A]">
            About
          </p>

          <h1 className="mt-3 text-5xl font-bold">
            Meet Anna
          </h1>

          <p className="mt-6 text-lg leading-8 text-[#5f675f]">
            I&apos;m dudle (the one on the left), the swaggiest swagmeister in the world!!!
          </p>

          <p className="mt-5 text-lg leading-8 text-[#5f675f]">
            I created NannyAnna because I am an ultimate swagmeister with more swag than anyone else (including my brother).
          </p>
        </div>

        {/* Photo */}
        <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-3xl">
          <Image
            src="/images/swagmeister.jpeg"
            alt="Anna from NannyAnna"
            fill
            className="object-cover"
            priority
          />
        </div>

      </div>
    </main>
  );
}