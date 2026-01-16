"use server";

/**
 * IMPORTANT: These TypeScript errors will be fixed after running:
 * 1. npx prisma migrate dev --name add_appointments
 * 2. npx prisma generate
 * 
 * The errors occur because prisma.appointment doesn't exist yet in the Prisma Client.
 * After migration, all errors will resolve automatically.
 */

import { PrismaClient } from "@prisma/client";
import { isAdmin } from "@/lib/adminAuth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { revalidatePath } from "next/cache";

let prisma: PrismaClient;
declare global {
  var __PRISMA__: PrismaClient | undefined;
}

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.__PRISMA__) {
    global.__PRISMA__ = new PrismaClient();
  }
  prisma = global.__PRISMA__;
}

// Define AppointmentStatus type until Prisma generates it
export type AppointmentStatus = "PENDING" | "APPROVED" | "DECLINED";

export type AppointmentData = {
  id: string;
  userId: string;
  date: string;
  time: string;
  reason: string;
  status: AppointmentStatus;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
};

// User: Create an appointment
export async function createAppointment(data: {
  date: string;
  time: string;
  reason: string;
}) {
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

  // Check if user already has a pending or approved appointment
  const existingAppointment = await prisma.appointment.findFirst({
    where: {
      userId: user.id,
      status: {
        in: ["PENDING", "APPROVED"],
      },
    },
  });

  if (existingAppointment) {
    throw new Error("You already have an active appointment");
  }

  const appointment = await prisma.appointment.create({
    data: {
      userId: user.id,
      date: data.date,
      time: data.time,
      reason: data.reason,
      status: "PENDING",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  revalidatePath("/");
  return appointment as AppointmentData;
}

// User: Get their own appointment
export async function getUserAppointment() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return null;
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return appointment as AppointmentData | null;
}

// User: Cancel their appointment
export async function cancelAppointment() {
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

  const appointment = await prisma.appointment.findFirst({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!appointment) {
    throw new Error("No appointment found");
  }

  await prisma.appointment.delete({
    where: {
      id: appointment.id,
    },
  });

  revalidatePath("/");
}

// Admin: Get all appointments
export async function getAllAppointments() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const userIsAdmin = await isAdmin(session.user.email);
  if (!userIsAdmin) {
    throw new Error("Forbidden");
  }

  const appointments = await prisma.appointment.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return appointments as AppointmentData[];
}

// Admin: Approve an appointment
export async function approveAppointment(appointmentId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const userIsAdmin = await isAdmin(session.user.email);
  if (!userIsAdmin) {
    throw new Error("Forbidden");
  }

  const appointment = await prisma.appointment.update({
    where: {
      id: appointmentId,
    },
    data: {
      status: "APPROVED",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  revalidatePath("/mod");
  return appointment as AppointmentData;
}

// Admin: Decline an appointment
export async function declineAppointment(appointmentId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const userIsAdmin = await isAdmin(session.user.email);
  if (!userIsAdmin) {
    throw new Error("Forbidden");
  }

  const appointment = await prisma.appointment.update({
    where: {
      id: appointmentId,
    },
    data: {
      status: "DECLINED",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  revalidatePath("/mod");
  return appointment as AppointmentData;
}

// Admin: Get appointment statistics
export async function getAppointmentStats() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const userIsAdmin = await isAdmin(session.user.email);
  if (!userIsAdmin) {
    throw new Error("Forbidden");
  }

  const [total, pending, approved, declined] = await Promise.all([
    prisma.appointment.count(),
    prisma.appointment.count({ where: { status: "PENDING" } }),
    prisma.appointment.count({ where: { status: "APPROVED" } }),
    prisma.appointment.count({ where: { status: "DECLINED" } }),
  ]);

  return {
    total,
    pending,
    approved,
    declined,
  };
}
