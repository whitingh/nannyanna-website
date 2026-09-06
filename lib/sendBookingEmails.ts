import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { DateTime } from "luxon";

const resend = new Resend(process.env.RESEND_API_KEY);

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

export async function sendBookingEmails(
  bookingId: number
) {
  const { data: booking, error } =
    await supabaseAdmin
      .from("bookings")
      .select(`
        id,
        customer_name,
        customer_email,
        customer_notes,
        start_time,
        end_time,
        payment_status,
        customer_confirmation_sent_at,
        admin_notification_sent_at,
        consultation_types (
          name,
          duration_minutes,
          location_type
        )
      `)
      .eq("id", bookingId)
      .single();

  if (error || !booking) {
    throw error || new Error("Booking not found.");
  }

  const consultation = Array.isArray(
    booking.consultation_types
  )
    ? booking.consultation_types[0]
    : booking.consultation_types;

  const start = DateTime.fromISO(
    booking.start_time
  ).setZone("Europe/London");

  const date = start.toFormat("cccc d LLLL yyyy");
  const time = start.toFormat("HH:mm");

  const location =
    consultation?.location_type === "in_person"
      ? "In person"
      : "Online video call";

  /*
    CUSTOMER CONFIRMATION
  */
  if (!booking.customer_confirmation_sent_at) {
    const claimTime = new Date().toISOString();

    const { data: claimedBooking, error: claimError } =
      await supabaseAdmin
        .from("bookings")
        .update({
          customer_confirmation_sent_at: claimTime,
        })
        .eq("id", bookingId)
        .is("customer_confirmation_sent_at", null)
        .select("id")
        .maybeSingle();

    if (claimError) {
      throw claimError;
    }

    if (claimedBooking) {
      const { error: emailError } =
        await resend.emails.send({
          from: "NannyAnna <hello@nannyanna.co.uk>",
          to: booking.customer_email,
          subject: "Your NannyAnna consultation is confirmed",
          html: `
            <div style="font-family: Arial, sans-serif; color: #2f2f2f; line-height: 1.6;">
              <h1 style="color: #527A5A;">
                Your booking is confirmed
              </h1>

              <p>
                Hi ${escapeHtml(booking.customer_name)},
              </p>

              <p>
                Thanks for booking with NannyAnna.
                Your consultation has been confirmed.
              </p>

              <div style="background: #E8F3E8; padding: 20px; border-radius: 12px; margin: 24px 0;">
                <strong>
                  ${escapeHtml(
                    consultation?.name || "Consultation"
                  )}
                </strong>

                <p style="margin-bottom: 0;">
                  ${escapeHtml(date)} at ${escapeHtml(time)}
                  <br>
                  ${
                    consultation?.duration_minutes
                      ? `${consultation.duration_minutes} minutes<br>`
                      : ""
                  }
                  ${escapeHtml(location)}
                </p>
              </div>

              <p>
                We look forward to speaking with you.
              </p>

              <p>
                Anna<br>
                NannyAnna
              </p>
            </div>
          `,
        });

      if (emailError) {
        await supabaseAdmin
          .from("bookings")
          .update({
            customer_confirmation_sent_at: null,
          })
          .eq("id", bookingId)
          .eq(
            "customer_confirmation_sent_at",
            claimTime
          );

        throw emailError;
      }
    }
  }

  /*
    ANNA NOTIFICATION
  */
  if (!booking.admin_notification_sent_at) {
    const claimTime = new Date().toISOString();

    const { data: claimedBooking, error: claimError } =
      await supabaseAdmin
        .from("bookings")
        .update({
          admin_notification_sent_at: claimTime,
        })
        .eq("id", bookingId)
        .is("admin_notification_sent_at", null)
        .select("id")
        .maybeSingle();

    if (claimError) {
      throw claimError;
    }

    if (claimedBooking) {
      const notes = booking.customer_notes?.trim();

      const { error: emailError } =
        await resend.emails.send({
          from: "NannyAnna <hello@nannyanna.co.uk>",
          to: "hello@nannyanna.co.uk",
          subject: `New booking: ${
            consultation?.name || "Consultation"
          }`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #2f2f2f; line-height: 1.6;">
              <h1 style="color: #527A5A;">
                New consultation booking
              </h1>

              <p>
                <strong>Consultation:</strong>
                ${escapeHtml(
                  consultation?.name || "Consultation"
                )}
              </p>

              <p>
                <strong>Date:</strong>
                ${escapeHtml(date)}
              </p>

              <p>
                <strong>Time:</strong>
                ${escapeHtml(time)}
              </p>

              <p>
                <strong>Customer:</strong>
                ${escapeHtml(booking.customer_name)}
              </p>

              <p>
                <strong>Email:</strong>
                ${escapeHtml(booking.customer_email)}
              </p>

              <p>
                <strong>Location:</strong>
                ${escapeHtml(location)}
              </p>

              ${
                notes
                  ? `
                    <p>
                      <strong>Customer notes:</strong><br>
                      ${escapeHtml(notes)}
                    </p>
                  `
                  : ""
              }
            </div>
          `,
        });

      if (emailError) {
        await supabaseAdmin
          .from("bookings")
          .update({
            admin_notification_sent_at: null,
          })
          .eq("id", bookingId)
          .eq(
            "admin_notification_sent_at",
            claimTime
          );

        throw emailError;
      }
    }
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}