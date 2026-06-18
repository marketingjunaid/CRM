import { PrismaClient, Role, LeadStatus, LeadSource, DealStage, TaskPriority, TaskStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const adminPassword = await bcrypt.hash("Admin@123", 12);
  const userPassword = await bcrypt.hash("User@123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@smartcrm.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@smartcrm.com",
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@smartcrm.com" },
    update: {},
    create: {
      name: "Sarah Manager",
      email: "manager@smartcrm.com",
      password: userPassword,
      role: Role.MANAGER,
    },
  });

  const salesUser = await prisma.user.upsert({
    where: { email: "sales@smartcrm.com" },
    update: {},
    create: {
      name: "John Sales",
      email: "sales@smartcrm.com",
      password: userPassword,
      role: Role.SALES_USER,
    },
  });

  const techCorp = await prisma.company.create({
    data: {
      name: "TechCorp Inc.",
      email: "info@techcorp.com",
      phone: "+1-555-0100",
      website: "https://techcorp.com",
      industry: "Technology",
      address: "123 Silicon Valley, CA 94025",
      notes: "Large enterprise client",
      createdById: admin.id,
    },
  });

  const startupXYZ = await prisma.company.create({
    data: {
      name: "StartupXYZ",
      email: "hello@startupxyz.io",
      phone: "+1-555-0200",
      website: "https://startupxyz.io",
      industry: "SaaS",
      address: "456 Market St, San Francisco, CA",
      createdById: manager.id,
    },
  });

  const contact1 = await prisma.contact.create({
    data: {
      firstName: "Alice",
      lastName: "Johnson",
      email: "alice@techcorp.com",
      phone: "+1-555-0101",
      company: "TechCorp Inc.",
      position: "VP of Sales",
      notes: "Key decision maker",
      companyId: techCorp.id,
      createdById: admin.id,
      assignedToId: salesUser.id,
    },
  });

  const contact2 = await prisma.contact.create({
    data: {
      firstName: "Bob",
      lastName: "Smith",
      email: "bob@startupxyz.io",
      phone: "+1-555-0201",
      company: "StartupXYZ",
      position: "CEO",
      companyId: startupXYZ.id,
      createdById: manager.id,
      assignedToId: salesUser.id,
    },
  });

  await prisma.lead.create({
    data: {
      firstName: "Charlie",
      lastName: "Brown",
      email: "charlie@example.com",
      phone: "+1-555-0301",
      company: "Brown Enterprises",
      position: "CTO",
      status: LeadStatus.NEW,
      source: LeadSource.WEBSITE,
      value: 15000,
      createdById: admin.id,
      assignedToId: salesUser.id,
    },
  });

  await prisma.lead.create({
    data: {
      firstName: "Diana",
      lastName: "Prince",
      email: "diana@wonderco.com",
      phone: "+1-555-0302",
      company: "Wonder Co",
      position: "Director",
      status: LeadStatus.CONTACTED,
      source: LeadSource.REFERRAL,
      value: 25000,
      createdById: manager.id,
      assignedToId: salesUser.id,
    },
  });

  await prisma.lead.create({
    data: {
      firstName: "Eve",
      lastName: "Walker",
      email: "eve@digitaledge.com",
      status: LeadStatus.QUALIFIED,
      source: LeadSource.GOOGLE_ADS,
      value: 8000,
      createdById: salesUser.id,
      assignedToId: salesUser.id,
    },
  });

  await prisma.lead.create({
    data: {
      firstName: "Frank",
      lastName: "Miller",
      email: "frank@miller.biz",
      status: LeadStatus.LOST,
      source: LeadSource.FACEBOOK,
      value: 5000,
      createdById: salesUser.id,
      assignedToId: salesUser.id,
    },
  });

  const deal1 = await prisma.deal.create({
    data: {
      title: "TechCorp Enterprise License",
      value: 50000,
      stage: DealStage.PROPOSAL,
      expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      contactId: contact1.id,
      companyId: techCorp.id,
      createdById: admin.id,
      assignedToId: salesUser.id,
      order: 0,
    },
  });

  await prisma.deal.create({
    data: {
      title: "StartupXYZ Growth Package",
      value: 12000,
      stage: DealStage.QUALIFICATION,
      expectedCloseDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      contactId: contact2.id,
      companyId: startupXYZ.id,
      createdById: manager.id,
      assignedToId: salesUser.id,
      order: 0,
    },
  });

  await prisma.deal.create({
    data: {
      title: "Annual SaaS Subscription",
      value: 8400,
      stage: DealStage.NEGOTIATION,
      expectedCloseDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdById: salesUser.id,
      assignedToId: salesUser.id,
      order: 0,
    },
  });

  await prisma.deal.create({
    data: {
      title: "Web Redesign Project",
      value: 15000,
      stage: DealStage.WON,
      createdById: salesUser.id,
      assignedToId: salesUser.id,
      order: 0,
    },
  });

  await prisma.task.create({
    data: {
      title: "Follow up with Alice Johnson",
      description: "Send updated proposal and schedule demo call",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      priority: TaskPriority.HIGH,
      status: TaskStatus.PENDING,
      dealId: deal1.id,
      contactId: contact1.id,
      createdById: admin.id,
      assignedToId: salesUser.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Prepare Q2 sales report",
      description: "Compile all deal data for Q2 presentation",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.IN_PROGRESS,
      createdById: manager.id,
      assignedToId: manager.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Send contract to Bob Smith",
      priority: TaskPriority.HIGH,
      status: TaskStatus.PENDING,
      contactId: contact2.id,
      createdById: salesUser.id,
      assignedToId: salesUser.id,
    },
  });

  await prisma.note.create({
    data: {
      content: "Had a great call with Alice. She is very interested in the enterprise package. Will send proposal by EOD.",
      contactId: contact1.id,
      createdById: salesUser.id,
    },
  });

  await prisma.note.create({
    data: {
      content: "Bob confirmed budget approval. Moving to negotiation stage.",
      contactId: contact2.id,
      createdById: manager.id,
    },
  });

  await prisma.note.create({
    data: {
      content: "TechCorp has 500 employees and is looking for a CRM replacement.",
      companyId: techCorp.id,
      createdById: admin.id,
    },
  });

  await prisma.activity.create({
    data: {
      type: "DEAL_CREATED",
      description: "Created deal: TechCorp Enterprise License",
      userId: admin.id,
      dealId: deal1.id,
    },
  });

  await prisma.activity.create({
    data: {
      type: "CONTACT_CREATED",
      description: "Added contact: Alice Johnson",
      userId: admin.id,
      contactId: contact1.id,
    },
  });

  await prisma.emailLog.create({
    data: {
      subject: "Proposal for Enterprise License",
      message: "Hi Alice, please find attached our enterprise license proposal for TechCorp. We look forward to discussing this with you.",
      recipient: "alice@techcorp.com",
      contactId: contact1.id,
      createdById: salesUser.id,
    },
  });

  console.log("Seed complete!");
  console.log("\nTest Accounts:");
  console.log("Admin:   admin@smartcrm.com / Admin@123");
  console.log("Manager: manager@smartcrm.com / User@123");
  console.log("Sales:   sales@smartcrm.com / User@123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
