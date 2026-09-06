import { createClient } from "@supabase/supabase-js";
import { createBookingCalendarEvent } from "@/lib/createBookingCalendarEvent";

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

export async function syncBookingToCalendar(
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
        status,
        calendar_event_id,
        consultation_types (
          name,
          location_type
        )
      `)
      .eq("id", bookingId)
      .single();

  if (error || !booking) {
    throw error || new Error("Booking not found.");
  }

  console.log("Calendar sync booking:", {
    id: booking.id,
    status: booking.status,
    calendarEventId: booking.calendar_event_id,
    startTime: booking.start_time,
    endTime: booking.end_time,
  });

  if (booking.status !== "confirmed") {
    return;
  }

  if (booking.calendar_event_id) {
    return;
  }

  const consultation = Array.isArray(
    booking.consultation_types
  )
    ? booking.consultation_types[0]
    : booking.consultation_types;

  if (!consultation) {
    throw new Error(
      "Consultation type not found for booking."
    );
  }

  console.log(
    `Creating calendar event for booking ${booking.id}`
  );

  const calendarEventId =
    await createBookingCalendarEvent({
      bookingId: booking.id,
      customerName: booking.customer_name,
      customerEmail: booking.customer_email,
      customerNotes: booking.customer_notes,
      consultationName: consultation.name,
      locationType: consultation.location_type,
      startTime: booking.start_time,
      endTime: booking.end_time,
    });

    console.log(
      `Calendar event created with ID: ${calendarEventId}`
    );

  const { error: updateError } =
    await supabaseAdmin
      .from("bookings")
      .update({
        calendar_event_id: calendarEventId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", booking.id)
      .is("calendar_event_id", null);

  if (updateError) {
    throw updateError;
  }
}