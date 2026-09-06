import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { DateTime } from "luxon";
import { getAvailableTimes } from "@/lib/bookingAvailability";
import { sendBookingEmails } from "@/lib/sendBookingEmails";
import { syncBookingToCalendar } from "@/lib/syncBookingToCalendar";

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

export async function POST(request: NextRequest) {
  let bookingId: number | null = null;

  try {
    const body = await request.json();

    const consultationId = Number(body.consultationId);
    const date = String(body.date || "");
    const time = String(body.time || "");
    const customerName = String(body.customerName || "").trim();
    const customerEmail = String(body.customerEmail || "").trim();
    const customerNotes = String(body.customerNotes || "").trim();

    if (
      !Number.isInteger(consultationId) ||
      consultationId <= 0 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !/^\d{2}:\d{2}$/.test(time) ||
      !customerName ||
      !customerEmail
    ) {
      return NextResponse.json(
        { error: "Please check your booking details." },
        { status: 400 }
      );
    }

    const { data: consultation, error: consultationError } =
      await supabaseAdmin
        .from("consultation_types")
        .select(
          "id, name, duration_minutes, price_pence, location_type, is_active"
        )
        .eq("id", consultationId)
        .eq("is_active", true)
        .single();

    if (consultationError || !consultation) {
      return NextResponse.json(
        { error: "This consultation is no longer available." },
        { status: 404 }
      );
    }

    /*
      Re-check availability on the server immediately before
      creating the payment session.

      We never trust the time sent by the browser.
    */
    const availableTimes = await getAvailableTimes(
      consultationId,
      date
    );

    if (!availableTimes.includes(time)) {
      return NextResponse.json(
        {
          error:
            "That appointment time is no longer available. Please choose another time.",
        },
        { status: 409 }
      );
    }

    const startTime = DateTime.fromISO(
      `${date}T${time}`,
      { zone: TIME_ZONE }
    );

    if (!startTime.isValid) {
      return NextResponse.json(
        { error: "Invalid appointment time." },
        { status: 400 }
      );
    }

    const endTime = startTime.plus({
      minutes: consultation.duration_minutes,
    });

    const expiresAt = DateTime.now()
      .plus({ minutes: 30 })
      .toUTC();

    /*
      Create a temporary booking hold before sending the
      customer to Stripe.
    */
    const { data: booking, error: bookingError } =
      await supabaseAdmin
        .from("bookings")
        .insert({
          consultation_type_id: consultation.id,
          customer_name: customerName,
          customer_email: customerEmail,
          start_time: startTime.toUTC().toISO(),
          end_time: endTime.toUTC().toISO(),
          status: "pending",
          payment_status: "unpaid",
          customer_notes: customerNotes || null,
          expires_at: expiresAt.toISO(),
        })
        .select("id")
        .single();

    if (bookingError || !booking) {
      console.error(bookingError);

      return NextResponse.json(
        { error: "Could not reserve this appointment." },
        { status: 500 }
      );
    }

    bookingId = booking.id;

    /*
      Free consultations do not need Stripe.

      The slot has already been checked and a temporary booking
      created, so we can confirm it immediately.
    */
    if (consultation.price_pence === 0) {
      const { error: confirmError } =
        await supabaseAdmin
          .from("bookings")
          .update({
            status: "confirmed",
            payment_status: "not_required",
            expires_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", booking.id);

      if (confirmError) {
        throw confirmError;
      }

      try {
        await syncBookingToCalendar(booking.id);
      } catch (calendarError) {
        console.error(
          "Could not sync free booking to calendar:",
          calendarError
        );
      }

      try {
        await sendBookingEmails(booking.id);
      } catch (emailError) {
        console.error(
          "Could not send free booking emails:",
          emailError
        );
      }

      return NextResponse.json({
        free: true,
        bookingId: booking.id,
      });
    }

    const origin = request.nextUrl.origin;

    const checkoutSession =
      await stripe.checkout.sessions.create({
        mode: "payment",

        expires_at: Math.floor(expiresAt.toSeconds()),

        customer_email: customerEmail,

        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "gbp",

              unit_amount: consultation.price_pence,

              product_data: {
                name: consultation.name,
                description: `${date} at ${time} · ${consultation.duration_minutes} minutes`,
              },
            },
          },
        ],

        metadata: {
          booking_id: String(booking.id),
        },

        success_url:
          `${origin}/book/success?session_id={CHECKOUT_SESSION_ID}`,

        cancel_url:
          `${origin}/book/${body.slug || ""}`,
      });

    if (!checkoutSession.url) {
      throw new Error("Stripe did not return a checkout URL.");
    }

    const { error: updateError } =
      await supabaseAdmin
        .from("bookings")
        .update({
          stripe_checkout_session_id: checkoutSession.id,
        })
        .eq("id", booking.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error(error);

    /*
      If Stripe creation fails after we've already made a hold,
      immediately expire it so it doesn't block the appointment.
    */
    if (bookingId) {
      await supabaseAdmin
        .from("bookings")
        .update({
          expires_at: DateTime.now().toUTC().toISO(),
        })
        .eq("id", bookingId);
    }

    return NextResponse.json(
      { error: "Could not start payment. Please try again." },
      { status: 500 }
    );
  }
}