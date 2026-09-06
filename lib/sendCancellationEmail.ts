import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { DateTime } from "luxon";

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

const resend = new Resend(
  process.env.RESEND_API_KEY!
);

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendCancellationEmail(
  bookingId: number
) {
  const { data: booking, error } =
    await supabaseAdmin
      .from("bookings")
      .select(`
        id,
        customer_name,
        customer_email,
        start_time,
        status,
        cancellation_email_sent_at,
        consultation_types (
          name
        )
      `)
      .eq("id", bookingId)
      .single();

  if (error || !booking) {
    throw error || new Error("Booking not found.");
  }

  if (booking.status !== "cancelled") {
    return;
  }

  if (booking.cancellation_email_sent_at) {
    return;
  }

  const consultation = Array.isArray(
    booking.consultation_types
  )
    ? booking.consultation_types[0]
    : booking.consultation_types;

  if (!consultation) {
    throw new Error(
      "Consultation type not found."
    );
  }

  // Claim the email before sending it.
  const claimTime = new Date().toISOString();

  const {
    data: claimedBooking,
    error: claimError,
  } = await supabaseAdmin
    .from("bookings")
    .update({
      cancellation_email_sent_at: claimTime,
    })
    .eq("id", bookingId)
    .is("cancellation_email_sent_at", null)
    .select("id")
    .maybeSingle();

  if (claimError) {
    throw claimError;
  }

  // Another request already claimed it.
  if (!claimedBooking) {
    return;
  }

  const start = DateTime.fromISO(
    booking.start_time
  ).setZone("Europe/London");

  const formattedDate =
    start.toFormat("cccc d LLLL yyyy");

  const formattedTime =
    start.toFormat("HH:mm");

  try {
    const { error: emailError } =
      await resend.emails.send({
        from: "NannyAnna <hello@nannyanna.co.uk>",
        to: booking.customer_email,
        subject:
          "Your NannyAnna consultation has been cancelled",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #2f2f2f;">
            <h2 style="color: #527A5A;">
              Booking cancelled
            </h2>

            <p>
              Hi ${escapeHtml(booking.customer_name)},
            </p>

            <p>
              Your NannyAnna consultation has been cancelled.
            </p>

            <p>
              <strong>Consultation:</strong>
              ${escapeHtml(consultation.name)}
              <br />
              <strong>Date:</strong>
              ${escapeHtml(formattedDate)}
              <br />
              <strong>Time:</strong>
              ${escapeHtml(formattedTime)}
            </p>

            <p>
              If you would like to arrange another consultation,
              you can make a new booking through NannyAnna.
            </p>

            <p>
              Best wishes,<br />
              Anna
            </p>
          </div>
        `,
      });

    if (emailError) {
      throw emailError;
    }
  } catch (emailError) {
    // Release the claim so the email can be retried.
    await supabaseAdmin
      .from("bookings")
      .update({
        cancellation_email_sent_at: null,
      })
      .eq("id", bookingId)
      .eq(
        "cancellation_email_sent_at",
        claimTime
      );

    throw emailError;
  }
}