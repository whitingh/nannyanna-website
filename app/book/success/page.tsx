"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type BookingConfirmation = {
  customerName: string;
  consultation: {
    name: string;
    duration_minutes: number;
    location_type: string;
  } | null;
  date: string;
  time: string;
  status: string;
  paymentStatus: string;
};

function BookingSuccessContent() {
  const searchParams = useSearchParams();

  const [booking, setBooking] =
    useState<BookingConfirmation | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBooking() {
      const sessionId = searchParams.get("session_id");
      const bookingId = searchParams.get("booking_id");
      const isFree = searchParams.get("free") === "true";

      if (!sessionId && !(isFree && bookingId)) {
        setError(
          "We could not find your booking confirmation."
        );
        setLoading(false);
        return;
      }

      try {
        const confirmationUrl =
          isFree && bookingId
            ? `/api/booking-confirmation?booking_id=${encodeURIComponent(
                bookingId
              )}&free=true`
            : `/api/booking-confirmation?session_id=${encodeURIComponent(
                sessionId!
              )}`;

        const response = await fetch(confirmationUrl);
        const data = await response.json();

        if (!response.ok) {
          setError(
            data.error ||
              "We could not load your booking."
          );
          return;
        }

        setBooking(data);
      } catch (error) {
        console.error(error);

        setError(
          "We could not load your booking."
        );
      } finally {
        setLoading(false);
      }
    }

    loadBooking();
  }, [searchParams]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#E8F3E8] px-6 py-16">
        <p className="text-center text-[#527A5A]">
          Loading your booking...
        </p>
      </main>
    );
  }

  if (!booking || error) {
    return (
      <main className="min-h-screen bg-[#E8F3E8] px-6 py-16 text-[#2f2f2f]">
        <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold">
            Booking confirmation
          </h1>

          <p className="mt-4 text-[#636b63]">
            {error ||
              "We could not load your booking."}
          </p>

          <Link
            href="/"
            className="mt-7 inline-block font-semibold text-[#527A5A]"
          >
            Back to NannyAnna
          </Link>
        </div>
      </main>
    );
  }

  const isInPerson =
    booking.consultation?.location_type ===
    "in_person";

  return (
    <main className="min-h-screen bg-[#E8F3E8] px-6 py-16 text-[#2f2f2f]">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 text-center shadow-sm md:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F3E8] text-3xl">
          ✓
        </div>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.15em] text-[#527A5A]">
          Booking confirmed
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          Thanks, {booking.customerName}
        </h1>

        <div className="mt-7 rounded-2xl bg-[#F7F8F5] p-6 text-left">
          <p className="font-bold">
            {booking.consultation?.name}
          </p>

          <p className="mt-2 text-[#636b63]">
            {booking.date} at {booking.time}
          </p>

          <p className="mt-1 text-sm text-[#636b63]">
            {booking.consultation?.duration_minutes} minutes ·{" "}
            {isInPerson
              ? "In person"
              : "Online video call"}
          </p>
        </div>

        <p className="mt-6 leading-7 text-[#636b63]">
          {booking.paymentStatus === "not_required"
            ? "Your appointment has been confirmed."
            : "Your payment was successful and your appointment has been reserved."}
        </p>

        <p className="mt-2 leading-7 text-[#636b63]">
          A confirmation email will be sent shortly.
        </p>

        <Link
          href="/"
          className="mt-8 inline-block rounded-full bg-[#527A5A] px-7 py-3 font-semibold text-white transition hover:bg-[#45694D]"
        >
          Back to NannyAnna
        </Link>
      </div>
    </main>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#E8F3E8] px-6 py-16">
          <p className="text-center text-[#527A5A]">
            Loading your booking...
          </p>
        </main>
      }
    >
      <BookingSuccessContent />
    </Suspense>
  );
}