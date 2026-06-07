import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import * as React from "react";
import { ShippingNotification } from "@/emails/ShippingNotification";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;
const resend = new Resend(process.env.RESEND_API_KEY);

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, trackingNumber } = await req.json();
  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (action === "ship") {
    if (!trackingNumber?.trim()) {
      return NextResponse.json({ error: "Tracking number required" }, { status: 400 });
    }

    const firstName = (order.customerName || order.customerEmail).split(" ")[0];

    await resend.emails.send({
      from: "FinalPing <noreply@finalpingapp.com>",
      to: order.customerEmail,
      subject: "Your FinalPing order has shipped!",
      react: React.createElement(ShippingNotification, { firstName, trackingNumber: trackingNumber.trim() }),
    });

    const updated = await prisma.order.update({
      where: { id: params.id },
      data: {
        status: "shipped",
        trackingNumber: trackingNumber.trim(),
        shippedAt: new Date(),
      },
    });

    return NextResponse.json({ order: updated });
  }

  if (action === "complete") {
    const updated = await prisma.order.update({
      where: { id: params.id },
      data: { status: "completed", completedAt: new Date() },
    });
    return NextResponse.json({ order: updated });
  }

  if (action === "pending") {
    const updated = await prisma.order.update({
      where: { id: params.id },
      data: { status: "pending", trackingNumber: null, shippedAt: null, completedAt: null },
    });
    return NextResponse.json({ order: updated });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
