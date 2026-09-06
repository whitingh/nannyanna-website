"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DateTime } from "luxon";
import { supabase } from "@/lib/supabase";

type Booking = {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_notes: string | null;
  start_time: string;
  end_time: string;
  status: string;
  payment_status: string;
  calendar_event_id: string | null;
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

type Tab = "upcoming" | "past";

export default function AdminBookingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");

  useEffect(() => {
    loadBookings();
  }, []);

  async function cancelBooking(
    bookingId: number
  ) {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking?"
    );

    if (!confirmed) {
      return;
    }

    try {
      console.log(
        "Starting cancellation for booking:",
        bookingId
      );

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        alert(
          "Your session has expired. Please sign in again."
        );
        router.push("/admin");
        return;
      }

      console.log("Sending cancellation request...");

      const response = await fetch(
        "/api/admin/bookings/cancel",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            bookingId,
          }),
        }
      );

      console.log(
        "Cancellation response status:",
        response.status
      );

      const responseText =
        await response.text();

      console.log(
        "Cancellation response:",
        responseText
      );

      let data;

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {};
      } catch {
        throw new Error(
          `Server returned an unexpected response: ${responseText}`
        );
      }

      if (!response.ok) {
        alert(
          data.error ||
            "Could not cancel the booking."
        );
        return;
      }

      alert("Booking cancelled.");

      await loadBookings();
    } catch (error) {
      console.error(
        "Cancellation request failed:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong while cancelling the booking."
      );
    }
  }

  async function loadBookings() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/admin");
      return;
    }

    const { data: profile, error: profileError } =
      await supabase
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

    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id,
        customer_name,
        customer_email,
        customer_notes,
        start_time,
        end_time,
        status,
        payment_status,
        calendar_event_id,
        consultation_types (
          name,
          duration_minutes,
          location_type
        )
      `)
      .order("start_time", {
        ascending: false,
      });

    if (error) {
      console.error(error);
      setMessage("Could not load bookings.");
      setLoading(false);
      return;
    }

    setBookings((data || []) as Booking[]);
    setLoading(false);
  }

  const now = DateTime.now().setZone("Europe/London");

  const upcomingBookings = bookings
    .filter((booking) => {
      const start = DateTime.fromISO(
        booking.start_time
      ).setZone("Europe/London");

      return (
        start >= now &&
        booking.status !== "cancelled"
      );
    })
    .sort((a, b) => {
      return (
        new Date(a.start_time).getTime() -
        new Date(b.start_time).getTime()
      );
    });

  const pastBookings = bookings
    .filter((booking) => {
      const start = DateTime.fromISO(
        booking.start_time
      ).setZone("Europe/London");

      return (
        start < now ||
        booking.status === "cancelled"
      );
    })
    .sort((a, b) => {
      return (
        new Date(b.start_time).getTime() -
        new Date(a.start_time).getTime()
      );
    });

  const visibleBookings =
    activeTab === "upcoming"
      ? upcomingBookings
      : pastBookings;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#E8F3E8] px-6 py-16">
        <p className="text-center text-[#527A5A]">
          Loading...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#E8F3E8] px-6 py-12 text-[#2f2f2f]">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#527A5A]">
              Admin
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Bookings
            </h1>

            <p className="mt-3 text-[#636b63]">
              View upcoming and previous NannyAnna consultations.
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-full border border-[#527A5A] px-5 py-3 text-center font-semibold text-[#527A5A] transition hover:bg-white"
          >
            Back to dashboard
          </Link>
        </div>

        <div className="mt-8 inline-flex rounded-full bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() =>
              setActiveTab("upcoming")
            }
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
              activeTab === "upcoming"
                ? "bg-[#527A5A] text-white"
                : "text-[#527A5A] hover:bg-[#E8F3E8]"
            }`}
          >
            Upcoming ({upcomingBookings.length})
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab("past")
            }
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
              activeTab === "past"
                ? "bg-[#527A5A] text-white"
                : "text-[#527A5A] hover:bg-[#E8F3E8]"
            }`}
          >
            Past ({pastBookings.length})
          </button>
        </div>

        {message && (
          <p className="mt-8 rounded-2xl bg-[#F4DDD2] px-4 py-3">
            {message}
          </p>
        )}

        {!message &&
          visibleBookings.length === 0 && (
            <div className="mt-10 rounded-3xl bg-white p-8 shadow-sm">
              <p className="text-[#636b63]">
                {activeTab === "upcoming"
                  ? "No upcoming bookings."
                  : "No past bookings."}
              </p>
            </div>
          )}

        <div className="mt-10 space-y-5">
          {visibleBookings.map((booking) => {
            const consultation = Array.isArray(
              booking.consultation_types
            )
              ? booking.consultation_types[0]
              : booking.consultation_types;

            const start = DateTime.fromISO(
              booking.start_time
            ).setZone("Europe/London");

            const date = start.toFormat(
              "cccc d LLLL yyyy"
            );

            const time = start.toFormat("HH:mm");

            const paymentLabel =
              booking.payment_status === "paid"
                ? "Paid"
                : booking.payment_status ===
                    "not_required"
                  ? "Free"
                  : booking.payment_status;

            return (
              <article
                key={booking.id}
                className="rounded-3xl bg-white p-6 shadow-sm md:p-8"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#527A5A]">
                      {date}
                    </p>

                    <h2 className="mt-1 text-2xl font-bold text-[#344C3D]">
                      {time} ·{" "}
                      {consultation?.name ||
                        "Consultation"}
                    </h2>

                    <p className="mt-2 text-[#636b63]">
                      {consultation?.duration_minutes
                        ? `${consultation.duration_minutes} minutes`
                        : ""}

                      {consultation?.duration_minutes
                        ? " · "
                        : ""}

                      {consultation?.location_type ===
                      "in_person"
                        ? "In person"
                        : "Online video call"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#E8F3E8] px-3 py-1 text-sm font-semibold text-[#527A5A]">
                      {booking.status}
                    </span>

                    <span className="rounded-full bg-[#F4DDD2] px-3 py-1 text-sm font-semibold text-[#7a594a]">
                      {paymentLabel}
                    </span>

                    <span className="rounded-full bg-[#F7F8F5] px-3 py-1 text-sm font-semibold text-[#636b63]">
                      {booking.calendar_event_id
                        ? "In calendar"
                        : "Not in calendar"}
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid gap-6 border-t border-black/10 pt-6 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8a918a]">
                      Customer
                    </p>

                    <p className="mt-2 font-semibold">
                      {booking.customer_name}
                    </p>

                    <a
                      href={`mailto:${booking.customer_email}`}
                      className="mt-1 inline-block text-[#527A5A] hover:underline"
                    >
                      {booking.customer_email}
                    </a>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8a918a]">
                      Notes
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-[#636b63]">
                      {booking.customer_notes?.trim() ||
                        "No notes provided."}
                    </p>
                  </div>
                </div>
                {activeTab === "upcoming" &&
                  booking.status !== "cancelled" && (
                    <div className="mt-6 border-t border-black/10 pt-6">
                      <button
                        type="button"
                        onClick={() =>
                          cancelBooking(booking.id)
                        }
                        className="rounded-full border border-red-300 px-5 py-2.5 font-semibold text-red-700 transition hover:bg-red-50"
                      >
                        Cancel booking
                      </button>
                    </div>
                  )}
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}