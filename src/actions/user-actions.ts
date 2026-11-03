"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { UserRole } from "@/lib/permissions";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";

export async function getUsers() {
  return await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      isActive: true,
      avatar: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createUser(data: {
  name: string;
  username: string;
  email?: string;
  password: string;
  role: UserRole;
}) {
  const session = await auth();
  if (session?.user && (session.user as any).role !== UserRole.ADMIN) {
    throw new Error("Hanya Administrator yang berhak membuat user baru");
  }

  const cleanUsername = data.username.trim().toLowerCase();
  const cleanEmail = data.email?.trim().toLowerCase() || null;

  // Check unique username
  const existingUsername = await prisma.user.findUnique({
    where: { username: cleanUsername },
  });
  if (existingUsername) {
    throw new Error(`Username "${cleanUsername}" sudah digunakan oleh pengguna lain`);
  }

  // Check unique email if provided
  if (cleanEmail) {
    const existingEmail = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });
    if (existingEmail) {
      throw new Error(`Email "${cleanEmail}" sudah digunakan oleh pengguna lain`);
    }
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const newUser = await prisma.user.create({
    data: {
      name: data.name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
      role: data.role,
      isActive: true,
    },
  });

  revalidatePath("/users");
  return newUser;
}

export async function updateUser(
  id: string,
  data: {
    name?: string;
    username?: string;
    email?: string;
    role?: UserRole;
    password?: string;
  }
) {
  const session = await auth();
  if (session?.user && (session.user as any).role !== UserRole.ADMIN) {
    throw new Error("Hanya Administrator yang berhak mengedit pengguna");
  }

  const updatePayload: any = {};

  if (data.name) updatePayload.name = data.name.trim();

  if (data.username) {
    const cleanUsername = data.username.trim().toLowerCase();
    const existing = await prisma.user.findFirst({
      where: {
        username: cleanUsername,
        NOT: { id },
      },
    });
    if (existing) {
      throw new Error(`Username "${cleanUsername}" sudah digunakan oleh pengguna lain`);
    }
    updatePayload.username = cleanUsername;
  }

  if (data.email !== undefined) {
    const cleanEmail = data.email?.trim().toLowerCase() || null;
    if (cleanEmail) {
      const existing = await prisma.user.findFirst({
        where: {
          email: cleanEmail,
          NOT: { id },
        },
      });
      if (existing) {
        throw new Error(`Email "${cleanEmail}" sudah digunakan oleh pengguna lain`);
      }
    }
    updatePayload.email = cleanEmail;
  }

  if (data.role) {
    // If downgrading an admin, make sure there's at least one other active admin
    if (data.role !== UserRole.ADMIN) {
      const activeAdminCount = await prisma.user.count({
        where: { role: UserRole.ADMIN, isActive: true, NOT: { id } },
      });
      if (activeAdminCount === 0) {
        throw new Error("Tidak dapat mengubah role Admin ini karena merupakan satu-satunya Admin aktif");
      }
    }
    updatePayload.role = data.role;
  }

  if (data.password && data.password.trim().length > 0) {
    updatePayload.password = await bcrypt.hash(data.password.trim(), 10);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updatePayload,
  });

  revalidatePath("/users");
  return updated;
}

export async function toggleUserStatus(id: string) {
  const session = await auth();
  if (session?.user && (session.user as any).role !== UserRole.ADMIN) {
    throw new Error("Hanya Administrator yang berhak mengubah status akun");
  }

  const user = await prisma.user.findUnique({
    where: { id },
  });
  if (!user) throw new Error("Pengguna tidak ditemukan");

  // Prevent deactivating the last active Admin
  if (user.role === UserRole.ADMIN && user.isActive) {
    const otherActiveAdmins = await prisma.user.count({
      where: { role: UserRole.ADMIN, isActive: true, NOT: { id } },
    });
    if (otherActiveAdmins === 0) {
      throw new Error("Tidak dapat menonaktifkan Admin ini karena merupakan satu-satunya Admin aktif di sistem");
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
  });

  revalidatePath("/users");
  return updated;
}

export async function deleteUser(id: string) {
  const session = await auth();
  if (session?.user && (session.user as any).role !== UserRole.ADMIN) {
    throw new Error("Hanya Administrator yang berhak menghapus akun");
  }

  // Prevent deleting own account
  if (session?.user && (session.user as any).id === id) {
    throw new Error("Anda tidak dapat menghapus akun Anda sendiri saat sedang login");
  }

  const user = await prisma.user.findUnique({
    where: { id },
  });
  if (!user) throw new Error("Pengguna tidak ditemukan");

  // Prevent deleting the last active Admin
  if (user.role === UserRole.ADMIN) {
    const otherActiveAdmins = await prisma.user.count({
      where: { role: UserRole.ADMIN, isActive: true, NOT: { id } },
    });
    if (otherActiveAdmins === 0) {
      throw new Error("Tidak dapat menghapus Admin ini karena merupakan satu-satunya Admin aktif di sistem");
    }
  }

  const deleted = await prisma.user.delete({
    where: { id },
  });

  revalidatePath("/users");
  return deleted;
}
