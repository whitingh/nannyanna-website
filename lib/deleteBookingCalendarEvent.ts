import { createDAVClient } from "tsdav";

export async function deleteBookingCalendarEvent(
  calendarEventId: string
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

  const filename = `${calendarEventId}.ics`;

  const objectUrl =
    `${calendarUrl}${filename}`;

  await client.deleteCalendarObject({
    calendarObject: {
      url: objectUrl,
      etag: "",
      data: "",
    },
  });
}