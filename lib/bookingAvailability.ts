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

export async function getAvailableTimes(
  consultationId: number,
  date: string
) {
  const requestedDate = DateTime.fromISO(date, {
    zone: TIME_ZONE,
  });

  if (!requestedDate.isValid) {
    throw new Error("Invalid date.");
  }

  const today = DateTime.now()
    .setZone(TIME_ZONE)
    .startOf("day");

  if (requestedDate.startOf("day") < today) {
    return [];
  }

  const { data: consultation, error: consultationError } =
    await supabaseAdmin
      .from("consultation_types")
      .select(
        "id, duration_minutes, location_type, is_active"
      )
      .eq("id", consultationId)
      .eq("is_active", true)
      .single();

  if (consultationError || !consultation) {
    throw new Error("Consultation not found.");
  }

  const dayOfWeek =
    requestedDate.weekday === 7
      ? 0
      : requestedDate.weekday;

  const { data: availabilityRule, error: availabilityError } =
    await supabaseAdmin
      .from("availability_rules")
      .select("start_time, end_time, is_available")
      .eq("day_of_week", dayOfWeek)
      .eq("is_available", true)
      .maybeSingle();

  if (availabilityError) {
    throw new Error("Could not check availability.");
  }

  if (
    !availabilityRule?.start_time ||
    !availabilityRule?.end_time
  ) {
    return [];
  }

  const { data: settings, error: settingsError } =
    await supabaseAdmin
      .from("booking_settings")
      .select(
        "online_buffer_minutes, in_person_buffer_minutes, slot_interval_minutes"
      )
      .limit(1)
      .single();

  if (settingsError || !settings) {
    throw new Error("Booking settings could not be loaded.");
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
    throw new Error("Invalid availability settings.");
  }

  const queryStart = requestedDate
    .startOf("day")
    .minus({ hours: 2 });

  const queryEnd = requestedDate
    .endOf("day")
    .plus({ hours: 2 });

  const { data: bookings, error: bookingsError } =
    await supabaseAdmin
      .from("bookings")
      .select("start_time, end_time, status, expires_at")
      .lt("start_time", queryEnd.toUTC().toISO())
      .gt("end_time", queryStart.toUTC().toISO())
      .in("status", ["pending", "confirmed"]);

  if (bookingsError) {
    throw new Error("Could not check existing bookings.");
  }

  const availableTimes: string[] = [];

  let slotStart = availabilityStart;

  while (
    slotStart.plus({
      minutes: consultation.duration_minutes,
    }) <= availabilityEnd
  ) {
    const slotEnd = slotStart.plus({
      minutes: consultation.duration_minutes,
    });

    const overlapsBooking = (bookings || []).some(
      (booking) => {
        if (
          booking.status === "pending" &&
          booking.expires_at &&
          DateTime.fromISO(booking.expires_at) <= DateTime.now()
        ) {
          return false;
        }

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

    if (!overlapsBooking && slotStart > now) {
      availableTimes.push(slotStart.toFormat("HH:mm"));
    }

    slotStart = slotStart.plus({
      minutes: settings.slot_interval_minutes,
    });
  }

  return availableTimes;
}

function createDateTime(date: string, time: string) {
  return DateTime.fromISO(
    `${date}T${time.slice(0, 5)}`,
    {
      zone: TIME_ZONE,
    }
  );
}