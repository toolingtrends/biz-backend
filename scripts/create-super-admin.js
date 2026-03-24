// backend/scripts/create-super-admin.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const name = "Super Admin";
  const email = "admin@biztrades.com";      // change to your email
  const phone = "+10000000000";           // optional
  const password = "Admin@biztrades";           // change to a strong password

  const existing = await prisma.superAdmin.findUnique({ where: { email } });
  if (existing) {
    console.log("Super admin already exists with this email:", email);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const superAdmin = await prisma.superAdmin.create({
    data: {
      name,
      email,
      phone,
      password: hashedPassword,
      role: "SUPER_ADMIN",
      permissions: [
        "Dashboard Overview",
        "Events Management",
        "Organizer Management",
        "Exhibitor Management",
        "Speaker Management",
        "Venue Management",
        "Visitor Management",
        "Financial & Transactions",
        "Content Management",
        "Marketing & Communication",
        "Reports & Analytics",
        "Integrations",
        "User Roles & Permissions",
        "Settings & Configuration",
        "Help & Support",
      ],
      isActive: true,
    },
  });

  console.log("Super admin created:");
  console.log({
    id: superAdmin.id,
    email: superAdmin.email,
    passwordPlaintext: password, // note: for your reference only
  });
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });