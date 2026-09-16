"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DateTime } from "luxon";
import { supabase } from "@/lib/supabase";

type Booking = {
  id: number;
  customer_name: string;
  customer_email: string;
  start_time: string;
  end_time: string;
  status: string;
  consultation_type_id: number;
  consultation_types:
    | {
        name: string;
        duration_minutes: number;
        location_type: string;
      }
    | {
        name: string;
        duration_minutes: number;
        location_type: string;
      }[]
    | null;
};

export default function RescheduleBookingPage() {
  const params = useParams();
  const router = useRouter();

  const bookingId = Number(params.id);

  const [booking, setBooking] =
    useState<Booking | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");
  
  const [selectedDate, setSelectedDate] =
    useState("");

  const [selectedTime, setSelectedTime] =
    useState("");

  const [availableTimes, setAvailableTimes] =
    useState<string[]>([]);

  const [loadingTimes, setLoadingTimes] =
    useState(false);

  const [rescheduling, setRescheduling] =
    useState(false);

  const [rescheduleError, setRescheduleError] =
    useState("");
  
  const minimumDate = useMemo(() => {
    const now = DateTime.now().setZone(
      "Europe/London"
    );

    return now.toFormat("yyyy-MM-dd");
  }, []);

  useEffect(() => {
    loadBooking();
  }, []);

  async function loadBooking() {
    if (
      !Number.isInteger(bookingId) ||
      bookingId <= 0
    ) {
      setMessage("Invalid booking.");
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/admin");
      return;
    }

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (
      profileError ||
      profile?.role !== "admin"
    ) {
      router.push("/admin");
      return;
    }

    const {
      data,
      error,
    } = await supabase
      .from("bookings")
      .select(`
        id,
        customer_name,
        customer_email,
        start_time,
        end_time,
        status,
        consultation_type_id,
        consultation_types (
          name,
          duration_minutes,
          location_type
        )
      `)
      .eq("id", bookingId)
      .single();

    if (error || !data) {
      console.error(error);
      setMessage(
        "Could not load this booking."
      );
      setLoading(false);
      return;
    }

    setBooking(data as Booking);
    setLoading(false);
  }

  async function handleDateChange(
    value: string
  ) {
    setSelectedDate(value);
    setSelectedTime("");
    setAvailableTimes([]);

    if (!value || !booking) {
      return;
    }

    setLoadingTimes(true);

    try {
      const response = await fetch(
        `/api/availability?consultationId=${booking.consultation_type_id}&date=${value}&excludeBookingId=${booking.id}`
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data);
        setAvailableTimes([]);
        return;
      }

      setAvailableTimes(
        data.availableTimes || []
      );
    } catch (error) {
      console.error(error);
      setAvailableTimes([]);
    } finally {
      setLoadingTimes(false);
    }
  }

  async function handleReschedule() {
    if (
      !booking ||
      !selectedDate ||
      !selectedTime
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Reschedule this booking to ${formatSelectedDate(
        selectedDate
      )} at ${selectedTime}?`
    );

    if (!confirmed) {
      return;
    }

    setRescheduling(true);
    setRescheduleError("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setRescheduleError(
          "Your session has expired. Please sign in again."
        );
        return;
      }

      const response = await fetch(
        "/api/admin/bookings/reschedule",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            bookingId: booking.id,
            date: selectedDate,
            time: selectedTime,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setRescheduleError(
          data.error ||
            "Could not reschedule the booking."
        );
        return;
      }

      alert("Booking rescheduled.");

      router.push("/admin/bookings");
    } catch (error) {
      console.error(error);

      setRescheduleError(
        "Could not reschedule the booking."
      );
    } finally {
      setRescheduling(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#E8F3E8] px-6 py-16">
        <p className="text-center text-[#527A5A]">
          Loading booking...
        </p>
      </main>
    );
  }

  if (!booking) {
    return (
      <main className="min-h-screen bg-[#E8F3E8] px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <p className="text-red-700">
              {message ||
                "Booking not found."}
            </p>

            <Link
              href="/admin/bookings"
              className="mt-6 inline-block font-semibold text-[#527A5A] hover:underline"
            >
              Back to bookings
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const consultation = Array.isArray(
    booking.consultation_types
  )
    ? booking.consultation_types[0]
    : booking.consultation_types;

  const start = DateTime.fromISO(
    booking.start_time
  ).setZone("Europe/London");

  const currentDate = start.toFormat(
    "cccc d LLLL yyyy"
  );

  const currentTime =
    start.toFormat("HH:mm");

  return (
    <main className="min-h-screen bg-[#E8F3E8] px-6 py-12 text-[#2f2f2f]">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/admin/bookings"
          className="font-semibold text-[#527A5A] hover:underline"
        >
          ← Back to bookings
        </Link>

        <div className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#527A5A]">
            Admin
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Reschedule booking
          </h1>

          <p className="mt-3 text-[#636b63]">
            Choose a new date and time for this consultation.
          </p>
        </div>

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8a918a]">
            Current booking
          </p>

          <h2 className="mt-3 text-2xl font-bold text-[#344C3D]">
            {consultation?.name ||
              "Consultation"}
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-sm text-[#8a918a]">
                Customer
              </p>

              <p className="mt-1 font-semibold">
                {booking.customer_name}
              </p>

              <p className="text-[#636b63]">
                {booking.customer_email}
              </p>
            </div>

            <div>
              <p className="text-sm text-[#8a918a]">
                Current appointment
              </p>

              <p className="mt-1 font-semibold">
                {currentDate}
              </p>

              <p className="text-[#636b63]">
                {currentTime}
                {consultation?.duration_minutes
                  ? ` · ${consultation.duration_minutes} minutes`
                  : ""}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8a918a]">
            New appointment
          </p>

          <h2 className="mt-2 text-2xl font-bold text-[#344C3D]">
            Choose a new date and time
          </h2>

          <p className="mt-3 text-[#636b63]">
            Select a date to see Anna&apos;s available times.
          </p>

          <div className="mt-7">
            <label
              htmlFor="rescheduleDate"
              className="mb-2 block font-semibold"
            >
              Date
            </label>

            <input
              id="rescheduleDate"
              type="date"
              min={minimumDate}
              value={selectedDate}
              onChange={(e) =>
                handleDateChange(e.target.value)
              }
              className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[#527A5A]"
            />
          </div>

          {selectedDate && (
            <div className="mt-8">
              <p className="font-semibold">
                Available start times
              </p>

              <p className="mt-1 text-sm text-[#636b63]">
                Choose the new start time for this booking.
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
                      onClick={() =>
                        setSelectedTime(time)
                      }
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
                  No times are available on this date.
                </p>
              )}
            </div>
          )}

          {selectedDate && selectedTime && (
            <div className="mt-8 border-t border-black/10 pt-6">
              <p className="text-sm text-[#636b63]">
                New appointment
              </p>

              <p className="mt-1 text-lg font-bold">
                {formatSelectedDate(selectedDate)} at{" "}
                {selectedTime}
              </p>

              <button
                type="button"
                onClick={handleReschedule}
                disabled={rescheduling}
                className="mt-6 w-full rounded-full bg-[#527A5A] px-6 py-4 text-lg font-semibold text-white transition hover:bg-[#45694D] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {rescheduling
                  ? "Rescheduling..."
                  : "Confirm reschedule"}
              </button>

              {rescheduleError && (
                <p className="mt-3 text-center text-sm font-medium text-red-700">
                  {rescheduleError}
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function formatSelectedDate(value: string) {
  const [year, month, day] = value
    .split("-")
    .map(Number);

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(
    new Date(year, month - 1, day)
  );
}