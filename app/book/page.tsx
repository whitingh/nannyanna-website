export default function BookPage() {
  return (
    <main className="min-h-screen bg-[#E8F3E8] text-[#2f2f2f]">
      <section className="mx-auto max-w-6xl px-6 py-16 md:px-12 md:py-24">
        <div className="grid gap-12 md:grid-cols-2 md:items-start">
          {/* Left side */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#527A5A]">
              One-to-one support
            </p>

            <h1 className="mt-3 text-4xl font-bold leading-tight md:text-6xl">
              Book a session with Anna
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-8 text-[#5f675f]">
              Get practical, personalised childcare support online or in
              person, based on your family&apos;s situation.
            </p>

            <div className="mt-10 space-y-6">
              <div className="rounded-3xl bg-white p-7 shadow-sm">
                <h2 className="text-xl font-bold">What can we talk about?</h2>

                <ul className="mt-4 space-y-3 leading-7 text-[#636b63]">
                  <li>• Sleep and bedtime routines</li>
                  <li>• Behaviour and boundaries</li>
                  <li>• Daily routines and schedules</li>
                  <li>• Activities and play</li>
                  <li>• Mealtimes and family routines</li>
                  <li>• Nursery or childcare transitions</li>
                  <li>• General childcare questions</li>
                </ul>
              </div>

              <div className="rounded-3xl bg-white p-7 shadow-sm">
                <h2 className="text-xl font-bold">How it works</h2>

                <div className="mt-4 space-y-4 text-[#636b63]">
                  <p>
                    <strong className="text-[#2f2f2f]">1.</strong> Choose
                    whether you&apos;d prefer an online or in-person
                    consultation.
                  </p>

                  <p>
                    <strong className="text-[#2f2f2f]">2.</strong> Choose a
                    session time that works for you.
                  </p>

                  <p>
                    <strong className="text-[#2f2f2f]">3.</strong> Tell Anna
                    what you&apos;d like help with before the session.
                  </p>

                  <p>
                    <strong className="text-[#2f2f2f]">4.</strong> Meet Anna
                    online or in person for practical, personalised support.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="space-y-6">
            {/* Online consultation */}
            <div className="rounded-3xl bg-white p-8 shadow-sm md:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#527A5A]">
                Online consultation
              </p>

              <h2 className="mt-3 text-3xl font-bold">
                One-to-one childcare advice
              </h2>

              <p className="mt-4 leading-7 text-[#636b63]">
                A private video call with Anna to talk through your questions,
                routines or childcare concerns from the comfort of your own
                home.
              </p>

              <div className="my-8 border-y border-black/10 py-6">
                <div className="flex items-center justify-between gap-6">
                  <span className="font-semibold">Session length</span>
                  <span className="text-right">60 minutes</span>
                </div>

                <div className="mt-4 flex items-center justify-between gap-6">
                  <span className="font-semibold">Format</span>
                  <span className="text-right">Online video call</span>
                </div>

                <div className="mt-4 flex items-center justify-between gap-6">
                  <span className="font-semibold">Price</span>
                  <span className="text-right">Coming soon</span>
                </div>
              </div>

              <button
                type="button"
                className="w-full rounded-full bg-[#527A5A] px-6 py-4 text-lg font-semibold text-white opacity-60"
              >
                Online booking coming soon
              </button>
            </div>

            {/* In-person consultation */}
            <div className="rounded-3xl bg-[#FFFDF8] p-8 shadow-sm md:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#527A5A]">
                In-person consultation
              </p>

              <h2 className="mt-3 text-3xl font-bold">
                Personal support in your home
              </h2>

              <p className="mt-4 leading-7 text-[#636b63]">
                Meet Anna in person for more hands-on support with routines,
                behaviour, activities or other day-to-day childcare
                challenges.
              </p>

              <div className="my-8 border-y border-black/10 py-6">
                <div className="flex items-center justify-between gap-6">
                  <span className="font-semibold">Session length</span>
                  <span className="text-right">From 90 minutes</span>
                </div>

                <div className="mt-4 flex items-center justify-between gap-6">
                  <span className="font-semibold">Format</span>
                  <span className="text-right">In person</span>
                </div>

                <div className="mt-4 flex items-center justify-between gap-6">
                  <span className="font-semibold">Price</span>
                  <span className="text-right">Coming soon</span>
                </div>
              </div>

              <p className="mb-6 text-sm leading-6 text-[#6b746b]">
                In-person sessions will be available in selected areas. Travel
                time and distance may affect the final price.
              </p>

              <button
                type="button"
                className="w-full rounded-full border-2 border-[#527A5A] px-6 py-4 text-lg font-semibold text-[#527A5A] opacity-60"
              >
                In-person booking coming soon
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}