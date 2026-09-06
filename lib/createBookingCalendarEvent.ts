import { createDAVClient } from "tsdav";

type BookingCalendarDetails = {
  bookingId: number;
  customerName: string;
  customerEmail: string;
  customerNotes?: string | null;
  consultationName: string;
  locationType: string;
  startTime: string;
  endTime: string;
};

export async function createBookingCalendarEvent(
  booking: BookingCalendarDetails
) {
  const client = await createDAVClient({
    serverUrl: process.env.CALDAV_URL!,
    credentials: {
      username: process.env.CALDAV_USERNAME!,
      password: process.env.CALDAV_PASSWORD!,
    },
    authMethod: "Basic",
    defaultAccountType: "caldav",
  });

  const calendarUrl =
    process.env.CALDAV_CALENDAR_URL!;

  const uid =
    `nannyanna-booking-${booking.bookingId}@nannyanna.co.uk`;

  const formatDate = (value: string | Date) =>
    new Date(value)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");

  const escapeIcs = (value: string) =>
    value
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");

  const location =
    booking.locationType === "in_person"
      ? "In person"
      : "Online video call";

  const description = [
    `Customer: ${booking.customerName}`,
    `Email: ${booking.customerEmail}`,
    booking.customerNotes
      ? `Notes: ${booking.customerNotes}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NannyAnna//Booking Calendar//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(booking.startTime)}`,
    `DTEND:${formatDate(booking.endTime)}`,
    `SUMMARY:${escapeIcs(
      `NannyAnna - ${booking.consultationName}`
    )}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    `LOCATION:${escapeIcs(location)}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const filename = `${uid}.ics`;

  await client.createCalendarObject({
    calendar: {
      url: calendarUrl,
    },
    filename,
    iCalString: ics,
  });

  return uid;
}