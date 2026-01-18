import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    app: "Change",
    message: "If you see this, ngrok is working!",
  });
}
