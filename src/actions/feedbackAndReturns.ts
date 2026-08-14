"use server";

import { FeedbackType, ReturnStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { isAdmin } from "@/lib/adminAuth";
import { revalidatePath } from "next/cache";
import Razorpay from "razorpay";

interface TestimonialOutput {
  id: string;
  content: string;
  userName: string;
}

interface FeedbackOutput {
  id: string;
  type: FeedbackType;
  content: string;
  showOnHome: boolean;
  createdAt: Date;
  userName: string;
  userEmail: string;
}

interface ReturnRequestOutput {
  id: string;
  orderId: string;
  reason: string;
  photoUrl: string;
  status: ReturnStatus;
  createdAt: Date;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
}

// Create Feedback
export async function createFeedback(data: { type: FeedbackType; content: string }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const feedback = await prisma.feedback.create({
    data: {
      userId: user.id,
      type: data.type,
      content: data.content,
      showOnHome: false,
    },
  });

  revalidatePath("/");
  return feedback;
}

// Get Home Testimonials (Approved testimonials to display on the Home page)
export async function getHomeTestimonials(): Promise<TestimonialOutput[]> {
  try {
    const testimonials = await prisma.feedback.findMany({
      where: {
        type: "TESTIMONIAL",
        showOnHome: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    return testimonials.map((t) => ({
      id: t.id,
      content: t.content,
      userName: t.user?.name || "Anonymous",
    }));
  } catch (error) {
    console.warn("Failed to query testimonials from database:", error instanceof Error ? error.message : String(error));
    return [];
  }
}

// Create Return Request
export async function createReturnRequest(data: { orderId: string; reason: string; photoBase64: string }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Verify the order belongs to this user
  const order = await prisma.order.findFirst({
    where: {
      id: data.orderId,
      userId: user.id,
    },
  });

  if (!order) {
    throw new Error("Order not found or unauthorized");
  }

  // Check if a return request already exists for this order
  const existingReturn = await prisma.returnRequest.findFirst({
    where: { orderId: data.orderId },
  });

  if (existingReturn) {
    throw new Error("A return request has already been submitted for this order.");
  }

  // Create return request
  const returnRequest = await prisma.returnRequest.create({
    data: {
      orderId: data.orderId,
      reason: data.reason,
      photoUrl: data.photoBase64, // Mandatorily saving the base64 picture
      status: "PENDING",
    },
  });

  // Update order status to RETURN_REQUESTED
  await prisma.order.update({
    where: { id: data.orderId },
    data: { status: "RETURN_REQUESTED" },
  });

  revalidatePath("/profile");
  return returnRequest;
}

// Admin: Get all feedback, complaints and testimonials
export async function getAllFeedbacks(): Promise<FeedbackOutput[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const userIsAdmin = await isAdmin(session.user.email);
  if (!userIsAdmin) {
    throw new Error("Forbidden");
  }

  const feedbacks = await prisma.feedback.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return feedbacks.map((f) => ({
    id: f.id,
    type: f.type,
    content: f.content,
    showOnHome: f.showOnHome,
    createdAt: f.createdAt,
    userName: f.user?.name || "Anonymous",
    userEmail: f.user?.email || "N/A",
  }));
}

// Admin: Update feedback showOnHome state
export async function updateFeedbackShowOnHome(feedbackId: string, showOnHome: boolean) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const userIsAdmin = await isAdmin(session.user.email);
  if (!userIsAdmin) {
    throw new Error("Forbidden");
  }

  const feedback = await prisma.feedback.update({
    where: { id: feedbackId },
    data: { showOnHome },
  });

  revalidatePath("/");
  return feedback;
}

// Admin: Get all return requests
export async function getAllReturnRequests(): Promise<ReturnRequestOutput[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const userIsAdmin = await isAdmin(session.user.email);
  if (!userIsAdmin) {
    throw new Error("Forbidden");
  }

  const returns = await prisma.returnRequest.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      order: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return returns.map((r) => ({
    id: r.id,
    orderId: r.orderId,
    reason: r.reason,
    photoUrl: r.photoUrl,
    status: r.status,
    createdAt: r.createdAt,
    customerName: r.order?.user?.name || "Anonymous",
    customerEmail: r.order?.user?.email || "N/A",
    totalAmount: r.order?.total || 0,
  }));
}

// Admin: Update return request status & process automatic Razorpay refund when approved
export async function updateReturnRequestStatus(requestId: string, status: ReturnStatus) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const userIsAdmin = await isAdmin(session.user.email);
  if (!userIsAdmin) {
    throw new Error("Forbidden");
  }

  const returnReq = await prisma.returnRequest.update({
    where: { id: requestId },
    data: { status },
  });

  // Update original order status accordingly
  revalidatePath("/profile");
  return returnReq;
}

// Admin: Process direct Razorpay refund API call for approved return request
export async function processRazorpayRefundAction(orderId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");

  const userIsAdmin = await isAdmin(session.user.email);
  if (!userIsAdmin) throw new Error("Forbidden");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true },
  });

  if (!order || !order.payment?.razorpayPaymentId) {
    throw new Error("No captured Razorpay payment found for this order.");
  }

  const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!razorpayKeyId || !razorpayKeySecret) {
    throw new Error("Razorpay credentials not configured on server.");
  }

  const razorpay = new Razorpay({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret,
  });

  const refundAmountPaise = Math.round(order.total * 100);
  const refund = await razorpay.payments.refund(order.payment.razorpayPaymentId, {
    amount: refundAmountPaise,
    notes: {
      reason: `Return Request Approved for Order ${order.id}`,
      orderId: order.id,
    },
  });

  revalidatePath("/mod");
  return { success: true, refundId: refund.id };
}
