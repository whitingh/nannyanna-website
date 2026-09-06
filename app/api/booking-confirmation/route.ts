import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { DateTime } from "luxon";

const TIME_ZONE = "Europe/London";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export async function GET(request: NextRequest) {
  try {
    const freeBookingId = Number(
      request.nextUrl.searchParams.get("booking_id")
    );

    const isFree =
      request.nextUrl.searchParams.get("free") === "true";

    if (
      isFree &&
      Number.isInteger(freeBookingId) &&
      freeBookingId > 0
    ) {
      const { data: booking, error: bookingError } =
        await supabaseAdmin
          .from("bookings")
          .select(`
            id,
            customer_name,
            start_time,
            end_time,
            status,
            payment_status,
            consultation_types (
              name,
              duration_minutes,
              location_type
            )
          `)
          .eq("id", freeBookingId)
          .eq("status", "confirmed")
          .eq("payment_status", "not_required")
          .single();

      if (bookingError || !booking) {
        return NextResponse.json(
          { error: "Booking could not be found." },
          { status: 404 }
        );
      }

      const start = DateTime.fromISO(
        booking.start_time,
        { zone: "utc" }
      ).setZone(TIME_ZONE);

      return NextResponse.json({
        customerName: booking.customer_name,
        consultation:
          Array.isArray(booking.consultation_types)
            ? booking.consultation_types[0]
            : booking.consultation_types,
        date: start.toFormat("cccc d LLLL yyyy"),
        time: start.toFormat("HH:mm"),
        status: booking.status,
        paymentStatus: booking.payment_status,
      });
    }
    const sessionId =
      request.nextUrl.searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing payment session." },
        { status: 400 }
      );
    }

    const session =
      await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment has not been completed." },
        { status: 400 }
      );
    }

    const bookingId = Number(
      session.metadata?.booking_id
    );

    if (
      !Number.isInteger(bookingId) ||
      bookingId <= 0
    ) {
      return NextResponse.json(
        { error: "Invalid booking." },
        { status: 400 }
      );
    }

    const { data: booking, error: bookingError } =
      await supabaseAdmin
        .from("bookings")
        .select(`
          id,
          customer_name,
          start_time,
          end_time,
          status,
          payment_status,
          consultation_types (
            name,
            duration_minutes,
            location_type
          )
        `)
        .eq("id", bookingId)
        .eq(
          "stripe_checkout_session_id",
          session.id
        )
        .single();

    if (bookingError || !booking) {
      console.error(bookingError);

      return NextResponse.json(
        { error: "Booking could not be found." },
        { status: 404 }
      );
    }

    const start = DateTime.fromISO(
      booking.start_time,
      { zone: "utc" }
    ).setZone(TIME_ZONE);

    return NextResponse.json({
      customerName: booking.customer_name,
      consultation:
        Array.isArray(booking.consultation_types)
          ? booking.consultation_types[0]
          : booking.consultation_types,
      date: start.toFormat("cccc d LLLL yyyy"),
      time: start.toFormat("HH:mm"),
      status: booking.status,
      paymentStatus: booking.payment_status,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Could not load booking confirmation." },
      { status: 500 }
    );
  }
}