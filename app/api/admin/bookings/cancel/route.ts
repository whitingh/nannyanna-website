import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { deleteBookingCalendarEvent } from "@/lib/deleteBookingCalendarEvent";
import { sendCancellationEmail } from "@/lib/sendCancellationEmail";

export async function POST(request: Request) {
  const admin = await requireAdmin(request);

  if (!admin.ok) {
    return NextResponse.json(
      {
        error: admin.error,
      },
      {
        status: admin.status,
      }
    );
  }

  try {
    const body = await request.json();
    const bookingId = Number(body.bookingId);

    if (
      !Number.isInteger(bookingId) ||
      bookingId <= 0
    ) {
      return NextResponse.json(
        {
          error: "Invalid booking ID.",
        },
        {
          status: 400,
        }
      );
    }

    const { data: booking, error: bookingError } =
      await admin.supabaseAdmin
        .from("bookings")
        .select(`
          id,
          status,
          calendar_event_id
        `)
        .eq("id", bookingId)
        .single();

    if (bookingError || !booking) {
      console.error(
        "Could not load booking:",
        bookingError
      );

      return NextResponse.json(
        {
          error: "Booking not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (booking.status === "cancelled") {
      return NextResponse.json({
        ok: true,
        alreadyCancelled: true,
      });
    }

    // Remove the calendar event first.
    // If this fails, we leave the booking unchanged.
    if (booking.calendar_event_id) {
      try {
        await deleteBookingCalendarEvent(
          booking.calendar_event_id
        );
      } catch (calendarError) {
        console.error(
          "Could not delete calendar event:",
          calendarError
        );

        return NextResponse.json(
          {
            error:
              "Could not remove the booking from the calendar.",
          },
          {
            status: 500,
          }
        );
      }
    }

    const { error: updateError } =
      await admin.supabaseAdmin
        .from("bookings")
        .update({
          status: "cancelled",
          calendar_event_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", booking.id);

    if (updateError) {
      console.error(
        "Could not cancel booking:",
        updateError
      );

      return NextResponse.json(
        {
          error: "Could not cancel booking.",
        },
        {
          status: 500,
        }
      );
    }

    try {
      await sendCancellationEmail(
        booking.id
      );
    } catch (emailError) {
      console.error(
        "Could not send cancellation email:",
        emailError
      );

      // The booking is already safely cancelled,
      // so don't undo the cancellation if email fails.
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "Unexpected cancellation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while cancelling the booking.",
      },
      {
        status: 500,
      }
    );
  }
}