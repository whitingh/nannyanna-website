import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { DateTime } from "luxon";

const TIME_ZONE = "Europe/London";

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
    const searchParams = request.nextUrl.searchParams;

    const consultationId = Number(
      searchParams.get("consultationId")
    );

    const date = searchParams.get("date");

    if (
      !Number.isInteger(consultationId) ||
      consultationId <= 0 ||
      !date ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
      return NextResponse.json(
        { error: "Invalid booking request." },
        { status: 400 }
      );
    }

    const requestedDate = DateTime.fromISO(date, {
      zone: TIME_ZONE,
    });

    if (!requestedDate.isValid) {
      return NextResponse.json(
        { error: "Invalid date." },
        { status: 400 }
      );
    }

    const today = DateTime.now()
      .setZone(TIME_ZONE)
      .startOf("day");

    if (requestedDate.startOf("day") < today) {
      return NextResponse.json(
        { error: "Bookings cannot be made in the past." },
        { status: 400 }
      );
    }

    const {
      data: consultation,
      error: consultationError,
    } = await supabaseAdmin
      .from("consultation_types")
      .select(
        "id, duration_minutes, location_type, is_active"
      )
      .eq("id", consultationId)
      .eq("is_active", true)
      .single();

    if (consultationError || !consultation) {
      console.error(consultationError);

      return NextResponse.json(
        { error: "Consultation not found." },
        { status: 404 }
      );
    }

    // Luxon weekday:
    // Monday = 1 ... Sunday = 7
    //
    // Our database:
    // Sunday = 0, Monday = 1 ... Saturday = 6
    const dayOfWeek =
      requestedDate.weekday === 7
        ? 0
        : requestedDate.weekday;

    const {
      data: availabilityRule,
      error: availabilityError,
    } = await supabaseAdmin
      .from("availability_rules")
      .select(
        "start_time, end_time, is_available"
      )
      .eq("day_of_week", dayOfWeek)
      .eq("is_available", true)
      .maybeSingle();

    if (availabilityError) {
      console.error(availabilityError);

      return NextResponse.json(
        { error: "Could not check availability." },
        { status: 500 }
      );
    }

    if (
      !availabilityRule?.start_time ||
      !availabilityRule?.end_time
    ) {
      return NextResponse.json({
        availableTimes: [],
      });
    }

    const {
      data: settings,
      error: settingsError,
    } = await supabaseAdmin
      .from("booking_settings")
      .select(
        "online_buffer_minutes, in_person_buffer_minutes, slot_interval_minutes"
      )
      .limit(1)
      .single();

    if (settingsError || !settings) {
      console.error(settingsError);

      return NextResponse.json(
        { error: "Booking settings could not be loaded." },
        { status: 500 }
      );
    }

    const bufferMinutes =
      consultation.location_type === "in_person"
        ? settings.in_person_buffer_minutes
        : settings.online_buffer_minutes;

    const availabilityStart = createDateTime(
      date,
      availabilityRule.start_time
    );

    const availabilityEnd = createDateTime(
      date,
      availabilityRule.end_time
    );

    if (
      !availabilityStart.isValid ||
      !availabilityEnd.isValid
    ) {
      return NextResponse.json(
        { error: "Invalid availability settings." },
        { status: 500 }
      );
    }

    /*
      Fetch bookings that could affect this day.

      We deliberately use a wider window than just the
      availability period because buffers can extend across
      the boundaries.
    */
    const queryStart = requestedDate
      .startOf("day")
      .minus({ hours: 2 });

    const queryEnd = requestedDate
      .endOf("day")
      .plus({ hours: 2 });

    const {
      data: bookings,
      error: bookingsError,
    } = await supabaseAdmin
      .from("bookings")
      .select("start_time, end_time, status")
      .lt("start_time", queryEnd.toUTC().toISO())
      .gt("end_time", queryStart.toUTC().toISO())
      .in("status", ["pending", "confirmed"]);

    if (bookingsError) {
      console.error(bookingsError);

      return NextResponse.json(
        { error: "Could not check existing bookings." },
        { status: 500 }
      );
    }

    const availableTimes: string[] = [];

    let slotStart = availabilityStart;

    while (
      slotStart
        .plus({ minutes: consultation.duration_minutes }) <=
      availabilityEnd
    ) {
      const slotEnd = slotStart.plus({
        minutes: consultation.duration_minutes,
      });

      /*
        The buffer is treated as time surrounding an existing
        booking.

        For example, an existing 10:00–11:00 booking with a
        15-minute buffer blocks 09:45–11:15.
      */
      const overlapsBooking = (bookings || []).some(
        (booking) => {
          const bookingStart = DateTime.fromISO(
            booking.start_time,
            { zone: "utc" }
          )
            .setZone(TIME_ZONE)
            .minus({ minutes: bufferMinutes });

          const bookingEnd = DateTime.fromISO(
            booking.end_time,
            { zone: "utc" }
          )
            .setZone(TIME_ZONE)
            .plus({ minutes: bufferMinutes });

          return (
            slotStart < bookingEnd &&
            slotEnd > bookingStart
          );
        }
      );

      const now = DateTime.now().setZone(TIME_ZONE);

      const isInFuture = slotStart > now;

      if (!overlapsBooking && isInFuture) {
        availableTimes.push(
          slotStart.toFormat("HH:mm")
        );
      }

      slotStart = slotStart.plus({
        minutes: settings.slot_interval_minutes,
      });
    }

    return NextResponse.json({
      availableTimes,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}

function createDateTime(date: string, time: string) {
  return DateTime.fromISO(
    `${date}T${time.slice(0, 5)}`,
    {
      zone: TIME_ZONE,
    }
  );
}