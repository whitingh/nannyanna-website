"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Consultation = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  duration_minutes: number;
  price_pence: number;
  location_type: string;
};


export default function ConsultationBookingPage() {
  const params = useParams();
  const slug = String(params.slug);

  const [consultation, setConsultation] =
    useState<Consultation | null>(null);

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [step, setStep] = useState<"time" | "details">("time");

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");

  const [startingPayment, setStartingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  useEffect(() => {
    loadBookingData();
  }, [slug]);

  async function loadBookingData() {
    setLoading(true);
    setMessage("");

    const { data: consultationData, error: consultationError } =
      await supabase
        .from("consultation_types")
        .select(
          "id, name, slug, description, duration_minutes, price_pence, location_type"
        )
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

    if (consultationError || !consultationData) {
      console.error("Consultation error details:", {
        message: consultationError?.message,
        details: consultationError?.details,
        hint: consultationError?.hint,
        code: consultationError?.code,
      });
      setMessage("This consultation is not currently available.");
      setLoading(false);
      return;
    }

    setConsultation(consultationData);
    setLoading(false);
  }

  const minimumDate = useMemo(() => {
    const today = new Date();

    return [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");
  }, []);

  async function handleDateChange(value: string) {
    setSelectedDate(value);
    setSelectedTime("");
    setAvailableTimes([]);
    setStep("time");

    if (!value || !consultation) {
      return;
    }

    setLoadingTimes(true);

    try {
      const response = await fetch(
        `/api/availability?consultationId=${consultation.id}&date=${value}`
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data);
        setAvailableTimes([]);
        return;
      }

      setAvailableTimes(data.availableTimes || []);
    } catch (error) {
      console.error(error);
      setAvailableTimes([]);
    } finally {
      setLoadingTimes(false);
    }
  }

  async function handleCheckout() {
    if (
      !consultation ||
      !selectedDate ||
      !selectedTime ||
      !customerName.trim() ||
      !customerEmail.trim()
    ) {
      return;
    }

    setStartingPayment(true);
    setPaymentError("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          consultationId: consultation.id,
          slug: consultation.slug,
          date: selectedDate,
          time: selectedTime,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerNotes: customerNotes.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPaymentError(
          data.error ||
            "Could not start payment. Please try again."
        );
        return;
      }

      if (data.free && data.bookingId) {
        window.location.href =
          `/book/success?booking_id=${data.bookingId}&free=true`;
        return;
      }

      if (!data.url) {
        setPaymentError(
          "Could not start payment. Please try again."
        );
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      console.error(error);

      setPaymentError(
        "Could not start payment. Please try again."
      );
    } finally {
      setStartingPayment(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#E8F3E8] px-6 py-16">
        <p className="text-center text-[#527A5A]">
          Loading booking options...
        </p>
      </main>
    );
  }

  if (!consultation || message) {
    return (
      <main className="min-h-screen bg-[#E8F3E8] px-6 py-16 text-[#2f2f2f]">
        <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">
            Booking unavailable
          </h1>

          <p className="mt-3 text-[#636b63]">
            {message || "This consultation is not currently available."}
          </p>

          <Link
            href="/book"
            className="mt-6 inline-block font-semibold text-[#527A5A]"
          >
            ← Back to consultations
          </Link>
        </div>
      </main>
    );
  }

  const isInPerson = consultation.location_type === "in_person";

  return (
    <main className="min-h-screen bg-[#E8F3E8] px-6 py-12 text-[#2f2f2f]">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/book"
          className="font-semibold text-[#527A5A]"
        >
          ← Back to consultations
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          {/* Consultation summary */}
          <div>
            <div className="rounded-3xl bg-white p-7 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#527A5A]">
                {isInPerson
                  ? "In-person consultation"
                  : "Online consultation"}
              </p>

              <h1 className="mt-3 text-3xl font-bold">
                {consultation.name}
              </h1>

              {consultation.description && (
                <p className="mt-4 leading-7 text-[#636b63]">
                  {consultation.description}
                </p>
              )}

              <div className="mt-6 space-y-3 border-t border-black/10 pt-6">
                <div className="flex justify-between gap-4">
                  <span className="font-semibold">Duration</span>
                  <span>{consultation.duration_minutes} minutes</span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="font-semibold">Format</span>
                  <span>
                    {isInPerson ? "In person" : "Online video call"}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="font-semibold">Price</span>
                  <span className="font-semibold">
                    £{(consultation.price_pence / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Date and time / customer details */}
            <div className="rounded-3xl bg-white p-7 shadow-sm md:p-9">
              {step === "time" && (
                <>
                  <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#527A5A]">
                    Choose a time
                  </p>

                  <h2 className="mt-2 text-3xl font-bold">
                    When would you like to meet?
                  </h2>

                  <div className="mt-8">
                    <label
                      htmlFor="bookingDate"
                      className="mb-2 block font-semibold"
                    >
                      Date
                    </label>

                    <input
                      id="bookingDate"
                      type="date"
                      min={minimumDate}
                      value={selectedDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[#527A5A]"
                    />
                  </div>

                  {selectedDate && (
                    <div className="mt-8">
                      <p className="font-semibold">
                        Available start times
                      </p>

                      <p className="mt-1 text-sm text-[#636b63]">
                        Choose the time that works best for you.
                      </p>

                      {loadingTimes ? (
                        <p className="mt-4 rounded-2xl bg-[#F7F8F5] p-5 text-[#636b63]">
                          Checking available times...
                        </p>
                      ) : availableTimes.length > 0 ? (
                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {availableTimes.map((time) => (
                            <button
                              key={time}
                              type="button"
                              onClick={() => setSelectedTime(time)}
                              className={`rounded-2xl border px-4 py-3 font-semibold transition ${
                                selectedTime === time
                                  ? "border-[#527A5A] bg-[#527A5A] text-white"
                                  : "border-black/10 hover:border-[#527A5A] hover:bg-[#E8F3E8]"
                              }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-4 rounded-2xl bg-[#F7F8F5] p-5 text-[#636b63]">
                          No times are available on this date. If you need a different
                          time, contact Anna at hello@nannyanna.co.uk
                        </p>
                      )}
                    </div>
                  )}

                  {selectedDate && selectedTime && (
                    <div className="mt-8 border-t border-black/10 pt-6">
                      <p className="text-sm text-[#636b63]">
                        Selected appointment
                      </p>

                      <p className="mt-1 text-lg font-bold">
                        {formatSelectedDate(selectedDate)} at {selectedTime}
                      </p>

                      <button
                        type="button"
                        onClick={() => setStep("details")}
                        className="mt-6 w-full rounded-full bg-[#527A5A] px-6 py-4 text-lg font-semibold text-white transition hover:bg-[#45694D]"
                      >
                        Continue
                      </button>
                    </div>
                  )}
                </>
              )}

              {step === "details" && selectedDate && selectedTime && (
                <>
                  <button
                    type="button"
                    onClick={() => setStep("time")}
                    className="text-sm font-semibold text-[#527A5A]"
                  >
                    ← Back to date and time
                  </button>

                  <p className="mt-6 text-sm font-semibold uppercase tracking-[0.15em] text-[#527A5A]">
                    Your details
                  </p>

                  <h2 className="mt-2 text-3xl font-bold">
                    Almost there
                  </h2>

                  <p className="mt-3 text-[#636b63]">
                    Enter your details before continuing to payment.
                  </p>

                  <div className="mt-7 rounded-2xl bg-[#F7F8F5] p-5">
                    <p className="text-sm text-[#636b63]">
                      Booking
                    </p>

                    <p className="mt-1 font-bold">
                      {consultation.name}
                    </p>

                    <p className="mt-2 text-sm text-[#636b63]">
                      {formatSelectedDate(selectedDate)} at {selectedTime}
                    </p>

                    <p className="mt-1 text-sm text-[#636b63]">
                      {consultation.duration_minutes} minutes ·{" "}
                      {isInPerson ? "In person" : "Online"}
                    </p>

                    <p className="mt-3 font-bold">
                      £{(consultation.price_pence / 100).toFixed(2)}
                    </p>
                  </div>

                  <div className="mt-7 space-y-5">
                    <div>
                      <label
                        htmlFor="customerName"
                        className="mb-2 block font-semibold"
                      >
                        Name
                      </label>

                      <input
                        id="customerName"
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        autoComplete="name"
                        className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[#527A5A]"
                        placeholder="Your name"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="customerEmail"
                        className="mb-2 block font-semibold"
                      >
                        Email
                      </label>

                      <input
                        id="customerEmail"
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        autoComplete="email"
                        className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[#527A5A]"
                        placeholder="you@example.com"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="customerNotes"
                        className="mb-2 block font-semibold"
                      >
                        Anything you'd like Anna to know?
                        <span className="ml-1 font-normal text-[#777]">
                          Optional
                        </span>
                      </label>

                      <textarea
                        id="customerNotes"
                        value={customerNotes}
                        onChange={(e) => setCustomerNotes(e.target.value)}
                        rows={5}
                        className="w-full resize-none rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[#527A5A]"
                        placeholder="A brief note about what you'd like help with..."
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={
                      !customerName.trim() ||
                      !customerEmail.trim() ||
                      startingPayment
                    }
                    className="mt-7 w-full rounded-full bg-[#527A5A] px-6 py-4 text-lg font-semibold text-white transition hover:bg-[#45694D] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {startingPayment
                      ? consultation.price_pence === 0
                        ? "Confirming booking..."
                        : "Opening secure payment..."
                      : consultation.price_pence === 0
                        ? "Confirm booking"
                        : "Continue to payment"}
                  </button>

                  {paymentError && (
                    <p className="mt-3 text-center text-sm font-medium text-red-700">
                      {paymentError}
                    </p>
                  )}

                  {consultation.price_pence > 0 && (
                    <p className="mt-3 text-center text-xs leading-5 text-[#777]">
                      Your booking is not confirmed until payment is completed.
                    </p>
                  )}
                </>
              )}
            </div>
        </div>
      </div>
    </main>
  );
}

function formatSelectedDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}