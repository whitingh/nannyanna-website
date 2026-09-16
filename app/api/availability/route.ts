import { NextRequest, NextResponse } from "next/server";
import { getAvailableTimes } from "@/lib/bookingAvailability";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const consultationId = Number(
      searchParams.get("consultationId")
    );

    const date = searchParams.get("date");

    const excludeBookingIdParam =
      searchParams.get("excludeBookingId");

    const excludeBookingId =
      excludeBookingIdParam
        ? Number(excludeBookingIdParam)
        : undefined;

    if (
      !Number.isInteger(consultationId) ||
      consultationId <= 0 ||
      !date ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      (excludeBookingId !== undefined &&
        (!Number.isInteger(excludeBookingId) ||
          excludeBookingId <= 0))
    ) {
      return NextResponse.json(
        { error: "Invalid booking request." },
        { status: 400 }
      );
    }

    const availableTimes = await getAvailableTimes(
      consultationId,
      date,
      excludeBookingId
    );

    return NextResponse.json({
      availableTimes,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Could not check availability." },
      { status: 500 }
    );
  }
}