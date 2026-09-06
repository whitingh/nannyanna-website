import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { sendBookingEmails } from "@/lib/sendBookingEmails";

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
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 }
    );
  }

  const webhookSecret =
    process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured.");

    return NextResponse.json(
      { error: "Webhook is not configured." },
      { status: 500 }
    );
  }

  try {
    /*
      Stripe requires the original raw request body when
      verifying webhook signatures.
    */
    const body = await request.text();

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;

      const bookingId = Number(
        session.metadata?.booking_id
      );

      if (
        !Number.isInteger(bookingId) ||
        bookingId <= 0
      ) {
        console.error(
          "Stripe session is missing a valid booking ID."
        );

        return NextResponse.json(
          { error: "Invalid booking metadata." },
          { status: 400 }
        );
      }

      /*
        For checkout.session.completed, only confirm immediately
        if Stripe says the payment has actually been paid.

        Delayed payment methods are confirmed later through
        checkout.session.async_payment_succeeded.
      */
      if (
        event.type === "checkout.session.completed" &&
        session.payment_status !== "paid"
      ) {
        return NextResponse.json({
          received: true,
        });
      }

      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id || null;

      const { data: updatedBooking, error: bookingError } =
        await supabaseAdmin
          .from("bookings")
          .update({
            status: "confirmed",
            payment_status: "paid",
            stripe_payment_intent_id: paymentIntentId,
            expires_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", bookingId)
          .eq(
            "stripe_checkout_session_id",
            session.id
          )
          .select("id")
          .maybeSingle();

      if (bookingError) {
        console.error(bookingError);

        return NextResponse.json(
          { error: "Could not confirm booking." },
          { status: 500 }
        );
      }

      if (!updatedBooking) {
        console.error(
          `No booking matched Stripe session ${session.id}.`
        );

        return NextResponse.json(
          { error: "Booking not found." },
          { status: 404 }
        );
      }

      try {
        await sendBookingEmails(bookingId);
      } catch (emailError) {
        console.error(
          "Could not send booking emails:",
          emailError
        );

        return NextResponse.json(
          { error: "Could not send booking emails." },
          { status: 500 }
        );
      }

      if (bookingError) {
        console.error(bookingError);

        return NextResponse.json(
          { error: "Could not confirm booking." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error("Stripe webhook error:", error);

    return NextResponse.json(
      { error: "Invalid webhook." },
      { status: 400 }
    );
  }
}