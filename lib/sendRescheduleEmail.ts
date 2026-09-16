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

export async function sendRescheduleEmail(
  rescheduleId: number
) {
  const { data: reschedule, error } =
    await supabaseAdmin
      .from("booking_reschedules")
      .select(`
        id,
        old_start_time,
        new_start_time,
        customer_email_sent_at,
        bookings (
          customer_name,
          customer_email,
          consultation_types (
            name,
            duration_minutes,
            location_type
          )
        )
      `)
      .eq("id", rescheduleId)
      .single();

  if (error || !reschedule) {
    throw error || new Error(
      "Reschedule record not found."
    );
  }

  if (reschedule.customer_email_sent_at) {
    return;
  }

  const booking = Array.isArray(
    reschedule.bookings
  )
    ? reschedule.bookings[0]
    : reschedule.bookings;

  if (!booking) {
    throw new Error("Booking not found.");
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

  /*
    Claim this particular reschedule email before
    sending it, preventing duplicate sends.
  */
  const claimTime = new Date().toISOString();

  const {
    data: claimedReschedule,
    error: claimError,
  } = await supabaseAdmin
    .from("booking_reschedules")
    .update({
      customer_email_sent_at: claimTime,
    })
    .eq("id", rescheduleId)
    .is("customer_email_sent_at", null)
    .select("id")
    .maybeSingle();

  if (claimError) {
    throw claimError;
  }

  if (!claimedReschedule) {
    return;
  }

  const oldStart = DateTime.fromISO(
    reschedule.old_start_time
  ).setZone("Europe/London");

  const newStart = DateTime.fromISO(
    reschedule.new_start_time
  ).setZone("Europe/London");

  const oldAppointment =
    `${oldStart.toFormat(
      "cccc d LLLL yyyy"
    )} at ${oldStart.toFormat("HH:mm")}`;

  const newAppointment =
    `${newStart.toFormat(
      "cccc d LLLL yyyy"
    )} at ${newStart.toFormat("HH:mm")}`;

  const location =
    consultation.location_type === "in_person"
      ? "In person"
      : "Online video call";

  try {
    const { error: emailError } =
      await resend.emails.send({
        from: "NannyAnna <hello@nannyanna.co.uk>",
        to: booking.customer_email,
        subject:
          "Your NannyAnna consultation has been rescheduled",
        html: `
          <div style="font-family: Arial, sans-serif; color: #2f2f2f; line-height: 1.6;">
            <h1 style="color: #527A5A;">
              Your booking has been rescheduled
            </h1>

            <p>
              Hi ${escapeHtml(
                booking.customer_name
              )},
            </p>

            <p>
              Your NannyAnna consultation has been
              rescheduled.
            </p>

            <div style="background: #E8F3E8; padding: 20px; border-radius: 12px; margin: 24px 0;">
              <strong>
                ${escapeHtml(
                  consultation.name
                )}
              </strong>

              <p style="margin-bottom: 0;">
                ${escapeHtml(newAppointment)}
                <br>
                ${consultation.duration_minutes} minutes
                <br>
                ${escapeHtml(location)}
              </p>
            </div>

            <p>
              Your previous appointment was
              ${escapeHtml(oldAppointment)}.
            </p>

            <p>
              We look forward to speaking with you.
            </p>

            <p>
              Best wishes,<br>
              Anna<br>
              NannyAnna
            </p>
          </div>
        `,
      });

    if (emailError) {
      throw emailError;
    }
  } catch (emailError) {
    /*
      Release the claim if Resend fails so this
      reschedule email can be retried.
    */
    await supabaseAdmin
      .from("booking_reschedules")
      .update({
        customer_email_sent_at: null,
      })
      .eq("id", rescheduleId)
      .eq(
        "customer_email_sent_at",
        claimTime
      );

    throw emailError;
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