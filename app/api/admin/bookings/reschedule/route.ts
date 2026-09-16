import { NextResponse } from "next/server";
import { DateTime } from "luxon";
import { requireAdmin } from "@/lib/requireAdmin";
import { getAvailableTimes } from "@/lib/bookingAvailability";
import { deleteBookingCalendarEvent } from "@/lib/deleteBookingCalendarEvent";
import { syncBookingToCalendar } from "@/lib/syncBookingToCalendar";
import { createBookingCalendarEvent } from "@/lib/createBookingCalendarEvent";
import { sendRescheduleEmail } from "@/lib/sendRescheduleEmail";

const TIME_ZONE = "Europe/London";

export async function POST(request: Request) {
  const admin = await requireAdmin(request);

  if (!admin.ok) {
    return NextResponse.json(
      { error: admin.error },
      { status: admin.status }
    );
  }

  try {
    const body = await request.json();

    const bookingId = Number(body.bookingId);
    const date = String(body.date || "");
    const time = String(body.time || "");

    if (
      !Number.isInteger(bookingId) ||
      bookingId <= 0 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !/^\d{2}:\d{2}$/.test(time)
    ) {
      return NextResponse.json(
        { error: "Invalid reschedule request." },
        { status: 400 }
      );
    }

    const { data: booking, error: bookingError } =
      await admin.supabaseAdmin
        .from("bookings")
        .select(`
          id,
          customer_name,
          customer_email,
          customer_notes,
          start_time,
          end_time,
          status,
          consultation_type_id,
          calendar_event_id,
          consultation_types (
            name,
            duration_minutes,
            location_type
          )
        `)
        .eq("id", bookingId)
        .single();

    if (bookingError || !booking) {
      console.error(
        "Could not load booking:",
        bookingError
      );

      return NextResponse.json(
        { error: "Booking not found." },
        { status: 404 }
      );
    }

    if (booking.status !== "confirmed") {
      return NextResponse.json(
        {
          error:
            "Only confirmed bookings can be rescheduled.",
        },
        { status: 400 }
      );
    }

    const consultation = Array.isArray(
      booking.consultation_types
    )
      ? booking.consultation_types[0]
      : booking.consultation_types;

    if (!consultation) {
      return NextResponse.json(
        {
          error:
            "Consultation details could not be loaded.",
        },
        { status: 500 }
      );
    }

    /*
      Re-check availability on the server.

      Never trust the time selected in the browser,
      because availability may have changed since the
      page was loaded.
    */
    const availableTimes =
      await getAvailableTimes(
        booking.consultation_type_id,
        date,
        booking.id
      );

    if (!availableTimes.includes(time)) {
      return NextResponse.json(
        {
          error:
            "That time is no longer available. Please choose another time.",
        },
        { status: 409 }
      );
    }

    const newStart = DateTime.fromISO(
      `${date}T${time}`,
      {
        zone: TIME_ZONE,
      }
    );

    if (!newStart.isValid) {
      return NextResponse.json(
        { error: "Invalid appointment time." },
        { status: 400 }
      );
    }

    const newEnd = newStart.plus({
      minutes: consultation.duration_minutes,
    });

    const oldCalendarEventId =
      booking.calendar_event_id;

    /*
      Remove the old calendar event first.

      If deletion fails, leave the database booking
      unchanged.
    */
    if (oldCalendarEventId) {
      try {
        await deleteBookingCalendarEvent(
          oldCalendarEventId
        );
      } catch (calendarError) {
        console.error(
          "Could not delete old calendar event:",
          calendarError
        );

        return NextResponse.json(
          {
            error:
              "Could not remove the old calendar event.",
          },
          { status: 500 }
        );
      }
    }

    /*
      Update the booking and clear calendar_event_id.

      syncBookingToCalendar() will then create a new
      calendar event using these new times.
    */
    const { error: updateError } =
      await admin.supabaseAdmin
        .from("bookings")
        .update({
          start_time: newStart.toUTC().toISO(),
          end_time: newEnd.toUTC().toISO(),
          calendar_event_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", booking.id);

    if (updateError) {
      console.error(
        "Could not update booking:",
        updateError
      );

      /*
        The old calendar event may already have been
        deleted. Try to restore it so the calendar
        remains consistent with the unchanged booking.
      */
      if (oldCalendarEventId) {
        try {
          const restoredCalendarEventId =
            await createBookingCalendarEvent({
              bookingId: booking.id,
              customerName: booking.customer_name,
              customerEmail: booking.customer_email,
              customerNotes: booking.customer_notes,
              consultationName:
                consultation.name,
              locationType:
                consultation.location_type,
              startTime: booking.start_time,
              endTime: booking.end_time,
            });

          /*
            Normally this should be the same deterministic
            event ID, but update the database in case the
            helper returns a different one.
          */
          if (
            restoredCalendarEventId !==
            oldCalendarEventId
          ) {
            const { error: restoreIdError } =
              await admin.supabaseAdmin
                .from("bookings")
                .update({
                  calendar_event_id:
                    restoredCalendarEventId,
                  updated_at:
                    new Date().toISOString(),
                })
                .eq("id", booking.id);

            if (restoreIdError) {
              console.error(
                "Old calendar event was recreated but its ID could not be restored in Supabase:",
                restoreIdError
              );
            }
          }
        } catch (restoreError) {
          console.error(
            "CRITICAL: booking update failed and old calendar event could not be restored:",
            restoreError
          );
        }
      }

      return NextResponse.json(
        {
          error: "Could not update the booking.",
        },
        { status: 500 }
      );
    }

    /*
      Create the replacement calendar event.
    */
    try {
      await syncBookingToCalendar(booking.id);
    } catch (calendarError) {
      console.error(
        "Could not create new calendar event:",
        calendarError
      );

      return NextResponse.json(
        {
          error:
            "The booking was rescheduled, but the new calendar event could not be created.",
        },
        { status: 500 }
      );
    }

    const {
      data: rescheduleRecord,
      error: rescheduleRecordError,
    } = await admin.supabaseAdmin
      .from("booking_reschedules")
      .insert({
        booking_id: booking.id,
        old_start_time: booking.start_time,
        old_end_time: booking.end_time,
        new_start_time: newStart.toUTC().toISO(),
        new_end_time: newEnd.toUTC().toISO(),
      })
      .select("id")
      .single();

    if (
      rescheduleRecordError ||
      !rescheduleRecord
    ) {
      console.error(
        "Could not create reschedule history:",
        rescheduleRecordError
      );
    } else {
      try {
        await sendRescheduleEmail(
          rescheduleRecord.id
        );
      } catch (emailError) {
        console.error(
          "Could not send reschedule email:",
          emailError
        );

        /*
          The booking and calendar have already been
          successfully rescheduled, so an email failure
          must not undo the reschedule.
        */
      }
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "Unexpected reschedule error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while rescheduling the booking.",
      },
      { status: 500 }
    );
  }
}