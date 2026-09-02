"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Consultation = {
  id: number;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_pence: number;
  location_type: string;
  is_active: boolean;
  sort_order: number;
  slug: string;
};

export default function BookPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConsultations();
  }, []);

  async function loadConsultations() {
    const { data, error } = await supabase
      .from("consultation_types")
      .select(
        "id, name, slug, description, duration_minutes, price_pence, location_type, is_active, sort_order"
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setConsultations(data || []);
    setLoading(false);
  }

  const onlineConsultations = useMemo(
    () =>
      consultations.filter(
        (consultation) => consultation.location_type === "online"
      ),
    [consultations]
  );

  const inPersonConsultations = useMemo(
    () =>
      consultations.filter(
        (consultation) => consultation.location_type === "in_person"
      ),
    [consultations]
  );

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
                    consultation that suits you.
                  </p>

                  <p>
                    <strong className="text-[#2f2f2f]">3.</strong> Choose a
                    session time that works for you.
                  </p>

                  <p>
                    <strong className="text-[#2f2f2f]">4.</strong> Tell Anna
                    what you&apos;d like help with before the session.
                  </p>

                  <p>
                    <strong className="text-[#2f2f2f]">5.</strong> Meet Anna
                    online or in person for practical, personalised support.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="space-y-8">
            {loading ? (
              <div className="rounded-3xl bg-white p-8 shadow-sm">
                <p className="text-[#636b63]">
                  Loading consultations...
                </p>
              </div>
            ) : (
              <>
                {/* Online consultations */}
                <div>
                  <p className="mb-4 text-sm font-semibold uppercase tracking-[0.15em] text-[#527A5A]">
                    Online consultations
                  </p>

                  <div className="space-y-6">
                    {onlineConsultations.length > 0 ? (
                      onlineConsultations.map((consultation) => (
                        <ConsultationCard
                          key={consultation.id}
                          consultation={consultation}
                        />
                      ))
                    ) : (
                      <div className="rounded-3xl bg-white p-8 shadow-sm">
                        <p className="text-[#636b63]">
                          No online consultations are currently available.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* In-person consultations */}
                <div>
                  <p className="mb-4 text-sm font-semibold uppercase tracking-[0.15em] text-[#527A5A]">
                    In-person consultations
                  </p>

                  <div className="space-y-6">
                    {inPersonConsultations.length > 0 ? (
                      inPersonConsultations.map((consultation) => (
                        <ConsultationCard
                          key={consultation.id}
                          consultation={consultation}
                        />
                      ))
                    ) : (
                      <div className="rounded-3xl bg-[#FFFDF8] p-8 shadow-sm">
                        <p className="text-[#636b63]">
                          No in-person consultations are currently available.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function ConsultationCard({
  consultation,
}: {
  consultation: Consultation;
}) {
  const isInPerson = consultation.location_type === "in_person";

  return (
    <div
      className={`rounded-3xl p-8 shadow-sm md:p-10 ${
        isInPerson ? "bg-[#FFFDF8]" : "bg-white"
      }`}
    >
      <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#527A5A]">
        {isInPerson ? "In-person consultation" : "Online consultation"}
      </p>

      <h2 className="mt-3 text-3xl font-bold">
        {consultation.name}
      </h2>

      {consultation.description && (
        <p className="mt-4 leading-7 text-[#636b63]">
          {consultation.description}
        </p>
      )}

      <div className="my-8 border-y border-black/10 py-6">
        <div className="flex items-center justify-between gap-6">
          <span className="font-semibold">Session length</span>

          <span className="text-right">
            {consultation.duration_minutes} minutes
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-6">
          <span className="font-semibold">Format</span>

          <span className="text-right">
            {isInPerson ? "In person" : "Online video call"}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-6">
          <span className="font-semibold">Price</span>

          <span className="text-right font-semibold">
            £{(consultation.price_pence / 100).toFixed(2)}
          </span>
        </div>
      </div>

      {isInPerson && (
        <p className="mb-6 text-sm leading-6 text-[#6b746b]">
          In-person sessions are available in selected areas. Travel time and
          distance may affect availability.
        </p>
      )}

      <Link
        href={`/book/${consultation.slug}`}
        className="block w-full rounded-full bg-[#527A5A] px-6 py-4 text-center text-lg font-semibold text-white transition hover:bg-[#45694D]"
      >
        Choose this consultation
      </Link>
    </div>
  );
}