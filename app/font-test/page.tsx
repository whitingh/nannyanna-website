import {
  Cormorant_Garamond,
  Playfair_Display,
  DM_Serif_Display,
  Libre_Baskerville,
  Lora,
  Merriweather,
  Bodoni_Moda,
  Fraunces,
  Quicksand,
  Nunito,
  Poppins,
  Montserrat,
} from "next/font/google";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["700"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700"],
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
});

const libre = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["700"],
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["700"],
});

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["700"],
});

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["700"],
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["700"],
});

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["700"],
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["700"],
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["700"],
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["700"],
});

const fonts = [
  ["Cormorant Garamond", cormorant.className],
  ["Playfair Display", playfair.className],
  ["DM Serif Display", dmSerif.className],
  ["Libre Baskerville", libre.className],
  ["Lora", lora.className],
  ["Merriweather", merriweather.className],
  ["Bodoni Moda", bodoni.className],
  ["Fraunces", fraunces.className],
  ["Quicksand", quicksand.className],
  ["Nunito", nunito.className],
  ["Poppins", poppins.className],
  ["Montserrat", montserrat.className],
];

export default function FontTestPage() {
  return (
    <main className="min-h-screen bg-[#E8F3E8] px-6 py-16 text-[#2f2f2f]">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#527A5A]">
          NannyAnna
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          Choose our new font
        </h1>

        <p className="mt-3 text-[#666]">
          The same NannyAnna heading shown in twelve different fonts.
        </p>

        <div className="mt-10 grid gap-5">
          {fonts.map(([name, className]) => (
            <div
              key={name}
              className="rounded-3xl bg-white p-7 shadow-sm md:p-9"
            >
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.15em] text-[#527A5A]">
                {name}
              </p>

              <p
                className={`${className} text-3xl leading-tight md:text-5xl`}
              >
                Helping parents feel more confident about childcare
              </p>

              <p className={`${className} mt-4 text-xl`}>
                Hi, I&apos;m Anna
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}