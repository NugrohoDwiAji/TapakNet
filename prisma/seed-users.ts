import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking and seeding default users...");

  const existingAdmin = await prisma.user.findFirst({
    where: { username: "admin" },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const admin = await prisma.user.create({
      data: {
        name: "Administrator tapakNet",
        username: "admin",
        email: "admin@tapaknet.id",
        password: hashedPassword,
        role: UserRole.ADMIN,
        isActive: true,
      },
    });
    console.log("Created default admin user:", admin.username);
  } else {
    console.log("Admin user already exists.");
  }

  const existingTech = await prisma.user.findFirst({
    where: { username: "teknisi" },
  });

  if (!existingTech) {
    const hashedPassword = await bcrypt.hash("teknisi123", 10);
    const tech = await prisma.user.create({
      data: {
        name: "Teknisi Lapangan",
        username: "teknisi",
        email: "teknisi@tapaknet.id",
        password: hashedPassword,
        role: UserRole.TECHNICIAN,
        isActive: true,
      },
    });
    console.log("Created default technician user:", tech.username);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
