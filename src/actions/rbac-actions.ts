"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  DEFAULT_ROLE_PERMISSIONS,
  ROLE_INFO,
  ALL_PERMISSION_KEYS,
  UserRole,
} from "@/lib/permissions";

export async function getRoleProfiles() {
  const existingProfiles = await prisma.roleProfile.findMany({
    orderBy: { role: "asc" },
  });

  const roles: UserRole[] = [UserRole.ADMIN, UserRole.TECHNICIAN, UserRole.FINANCE];
  const existingMap = new Map(existingProfiles.map((p) => [p.role, p]));

  // Auto-initialize missing role profiles if they don't exist yet
  const result = [];
  for (const r of roles) {
    if (existingMap.has(r)) {
      result.push(existingMap.get(r)!);
    } else {
      const created = await prisma.roleProfile.create({
        data: {
          role: r,
          displayName: ROLE_INFO[r].name,
          description: ROLE_INFO[r].description,
          permissions: DEFAULT_ROLE_PERMISSIONS[r],
        },
      });
      result.push(created);
    }
  }

  return result.map((p) => ({
    id: p.id,
    role: p.role,
    displayName: p.displayName,
    description: p.description,
    permissions: (Array.isArray(p.permissions) ? p.permissions : []) as string[],
    updatedAt: p.updatedAt,
  }));
}

export async function updateRolePermissions(role: UserRole, permissions: string[]) {
  const session = await auth();
  if (session?.user && (session.user as any).role !== UserRole.ADMIN) {
    throw new Error("Hanya Administrator yang berhak mengubah matriks hak akses RBAC");
  }

  // Ensure Admin always retains rbac:manage to prevent accidental lockout
  let finalPermissions = [...permissions];
  if (role === UserRole.ADMIN && !finalPermissions.includes("rbac:manage")) {
    finalPermissions.push("rbac:manage");
  }

  const updated = await prisma.roleProfile.upsert({
    where: { role },
    update: {
      permissions: finalPermissions,
      displayName: ROLE_INFO[role].name,
      description: ROLE_INFO[role].description,
    },
    create: {
      role,
      displayName: ROLE_INFO[role].name,
      description: ROLE_INFO[role].description,
      permissions: finalPermissions,
    },
  });

  revalidatePath("/rbac");
  revalidatePath("/users");
  revalidatePath("/dashboard");
  return updated;
}

export async function resetRolePermissionsToDefault(role: UserRole) {
  const session = await auth();
  if (session?.user && (session.user as any).role !== UserRole.ADMIN) {
    throw new Error("Hanya Administrator yang berhak mereset hak akses RBAC");
  }

  const updated = await prisma.roleProfile.upsert({
    where: { role },
    update: {
      permissions: DEFAULT_ROLE_PERMISSIONS[role],
    },
    create: {
      role,
      displayName: ROLE_INFO[role].name,
      description: ROLE_INFO[role].description,
      permissions: DEFAULT_ROLE_PERMISSIONS[role],
    },
  });

  revalidatePath("/rbac");
  return updated;
}
