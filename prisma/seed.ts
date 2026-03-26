import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clinic
  const clinic = await prisma.clinic.upsert({
    where: { slug: "hendek-dis" },
    update: {},
    create: {
      name: "Hendek Diş Polikliniği",
      slug: "hendek-dis",
      phone: "0264 000 00 00",
      email: "info@hendekdis.com",
      address: "Hendek, Sakarya",
    },
  });

  // Admin User
  const adminPassword = await hash("Admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@hendekdis.com" },
    update: {},
    create: {
      clinicId: clinic.id,
      email: "admin@hendekdis.com",
      username: "admin",
      password: adminPassword,
      name: "Erkan Edem",
      role: "ADMIN",
    },
  });

  // Doctor User
  const doctorPassword = await hash("Doctor123", 12);
  await prisma.user.upsert({
    where: { email: "hekim@hendekdis.com" },
    update: {},
    create: {
      clinicId: clinic.id,
      email: "hekim@hendekdis.com",
      username: "drmelis",
      password: doctorPassword,
      name: "Dr. Melis Çetin",
      role: "DOCTOR",
    },
  });

  // Secretary User
  const secPassword = await hash("Sekreter123", 12);
  await prisma.user.upsert({
    where: { email: "sekreter@hendekdis.com" },
    update: {},
    create: {
      clinicId: clinic.id,
      email: "sekreter@hendekdis.com",
      username: "sekreter",
      password: secPassword,
      name: "Ayşe Yılmaz",
      role: "SECRETARY",
    },
  });

  // Doctors
  const doctors = [
    {
      name: "Dr. Melis Çetin",
      title: "Ortodonti Uzmanı",
      specialty: "Ortodonti",
      color: "#00677e",
    },
    {
      name: "Dr. Kenan Yıldız",
      title: "Çene Cerrahı",
      specialty: "Cerrahi",
      color: "#7c3aed",
    },
    {
      name: "Dr. Arda Caner",
      title: "Pedodonti Uzmanı",
      specialty: "Pedodonti",
      color: "#f59e0b",
    },
  ];

  for (const doc of doctors) {
    const email = `${doc.name.split(" ")[1]?.toLowerCase() ?? "dr"}@hendekdis.com`;
    await prisma.doctor.upsert({
      where: { clinicId_email: { clinicId: clinic.id, email } },
      update: {},
      create: { clinicId: clinic.id, ...doc, email },
    });
  }

  // Treatment Definitions
  const treatments = [
    {
      code: "T001",
      name: "Muayene",
      category: "Genel",
      price: 500,
      duration: 30,
    },
    {
      code: "T002",
      name: "Dolgu (Kompozit)",
      category: "Restoratif",
      price: 1500,
      duration: 45,
    },
    {
      code: "T003",
      name: "Kanal Tedavisi",
      category: "Endodonti",
      price: 3000,
      duration: 60,
    },
    {
      code: "T004",
      name: "Diş Çekimi",
      category: "Cerrahi",
      price: 1000,
      duration: 30,
    },
    {
      code: "T005",
      name: "İmplant",
      category: "Cerrahi",
      price: 15000,
      duration: 90,
    },
    {
      code: "T006",
      name: "Diş Taşı Temizliği",
      category: "Periodontoloji",
      price: 800,
      duration: 30,
    },
    {
      code: "T007",
      name: "Porselen Kaplama",
      category: "Protez",
      price: 5000,
      duration: 60,
    },
    {
      code: "T008",
      name: "Ortodonti (Braket)",
      category: "Ortodonti",
      price: 25000,
      duration: 45,
    },
  ];

  for (const t of treatments) {
    await prisma.treatmentDefinition.upsert({
      where: { clinicId_code: { clinicId: clinic.id, code: t.code } },
      update: {},
      create: { clinicId: clinic.id, ...t },
    });
  }

  // Sample Patients
  const patients = [
    {
      patientNo: "H001",
      firstName: "Zeynep",
      lastName: "Yılmaz",
      phone: "0532 000 0001",
      bloodType: "0Rh+",
      gender: "FEMALE" as const,
    },
    {
      patientNo: "H002",
      firstName: "Mert",
      lastName: "Demir",
      phone: "0533 000 0002",
      bloodType: "ARh+",
      gender: "MALE" as const,
    },
    {
      patientNo: "H003",
      firstName: "Selin",
      lastName: "Yavuz",
      phone: "0534 000 0003",
      bloodType: "BRh-",
      gender: "FEMALE" as const,
    },
    {
      patientNo: "H004",
      firstName: "Caner",
      lastName: "Yıldız",
      phone: "0535 000 0004",
      bloodType: "ABRh+",
      gender: "MALE" as const,
    },
    {
      patientNo: "H005",
      firstName: "Fatma",
      lastName: "Keskin",
      phone: "0536 000 0005",
      bloodType: "0Rh-",
      gender: "FEMALE" as const,
    },
  ];

  for (const p of patients) {
    const patient = await prisma.patient.upsert({
      where: {
        clinicId_patientNo: { clinicId: clinic.id, patientNo: p.patientNo },
      },
      update: {},
      create: { clinicId: clinic.id, ...p },
    });

    // Create account for each patient
    await prisma.patientAccount.upsert({
      where: { patientId: patient.id },
      update: {},
      create: { patientId: patient.id, balance: 0 },
    });
  }

  // Add allergy for first patient
  const zeynep = await prisma.patient.findFirst({
    where: { patientNo: "H001" },
  });
  if (zeynep) {
    await prisma.patientAllergy.createMany({
      data: [
        { patientId: zeynep.id, allergen: "Penisilin", severity: "HIGH" },
        { patientId: zeynep.id, allergen: "Lateks", severity: "HIGH" },
      ],
      skipDuplicates: true,
    });
  }

  console.log("✅ Seed data oluşturuldu!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
