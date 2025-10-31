import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/tracking/location
 * Receive location updates from clients
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, latitude, longitude, accuracy, distance, timestamp } = body;

    if (!userId || !latitude || !longitude) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Log location update
    console.log(`📍 Location update from ${userId}:`, {
      latitude,
      longitude,
      distance: `${distance?.toFixed(2)}m`,
      accuracy: `${accuracy?.toFixed(2)}m`,
      time: new Date(timestamp).toLocaleTimeString(),
    });

    // Here you can store location in database if needed
    // await storeLocationUpdate(userId, latitude, longitude, timestamp);

    return NextResponse.json({
      success: true,
      message: 'Location updated',
    });
  } catch (error) {
    console.error('Error processing location update:', error);
    return NextResponse.json(
      { error: 'Failed to process location update' },
      { status: 500 }
    );
  }
}
