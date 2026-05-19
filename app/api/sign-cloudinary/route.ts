import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const { paramsToSign } = await request.json();

    if (!paramsToSign || typeof paramsToSign !== "object") {
      return NextResponse.json({ error: "Invalid body structure" }, { status: 400 });
    }

    const { timestamp, folder } = paramsToSign;
    if (!timestamp || !folder) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // Validate folder format (strictly blink/<eventId>)
    if (typeof folder !== "string" || !/^blink\/[a-zA-Z0-9_-]+$/.test(folder)) {
      return NextResponse.json({ error: "Invalid folder format" }, { status: 400 });
    }

    // Validate timestamp (within 5 minutes)
    const clientTime = Number(timestamp);
    const serverTime = Math.round(Date.now() / 1000);
    if (isNaN(clientTime) || Math.abs(serverTime - clientTime) > 300) {
      return NextResponse.json({ error: "Timestamp invalid or expired" }, { status: 400 });
    }

    // Enforce that only allowed keys are signed
    const keys = Object.keys(paramsToSign);
    const allowedKeys = ["timestamp", "folder"];
    const hasOnlyAllowedKeys = keys.every(key => allowedKeys.includes(key)) && keys.length === allowedKeys.length;
    if (!hasOnlyAllowedKeys) {
      return NextResponse.json({ error: "Forbidden parameters to sign" }, { status: 400 });
    }

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!
    );
    return NextResponse.json({ signature });
  } catch (error) {
    return NextResponse.json({ error: "Failed to sign" }, { status: 500 });
  }
}
