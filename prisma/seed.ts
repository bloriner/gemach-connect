import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data in correct order (respecting foreign keys)
  await prisma.threadRead.deleteMany();
  await prisma.message.deleteMany();
  await prisma.thread.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.gemach.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash("demo1234", 10);

  // ── Users ──────────────────────────────────────────────
  const demo = await prisma.user.create({
    data: {
      email: "demo@gemach.app",
      name: "Demo User",
      password: hash,
      phone: "(718) 555-0100",
      city: "Brooklyn",
      state: "NY",
      bio: "Community organizer passionate about chesed.",
      avatarColor: "blue",
    },
  });

  const ownerData = [
    { email: "owner1@gemach.app", name: "Sarah Cohen", phone: "(718) 555-0101", city: "Brooklyn", state: "NY", bio: "Running a baby gemach for 5 years.", avatarColor: "pink" },
    { email: "owner2@gemach.app", name: "Rivky Friedman", phone: "(732) 555-0102", city: "Lakewood", state: "NJ", bio: "Kallah teacher and gown lender.", avatarColor: "purple" },
    { email: "owner3@gemach.app", name: "Chaim Rosenberg", phone: "(845) 555-0103", city: "Monsey", state: "NY", bio: "Medical equipment for bikur cholim.", avatarColor: "red" },
    { email: "owner4@gemach.app", name: "Leah Goldstein", phone: "(973) 555-0104", city: "Passaic", state: "NJ", bio: "Kitchen supplies for new families.", avatarColor: "amber" },
    { email: "owner5@gemach.app", name: "Dovid Weiss", phone: "(410) 555-0105", city: "Baltimore", state: "MD", bio: "Tomchei Shabbos coordinator.", avatarColor: "green" },
    { email: "owner6@gemach.app", name: "Miriam Katz", phone: "(323) 555-0106", city: "Los Angeles", state: "CA", bio: "Clothing gemach for families in need.", avatarColor: "teal" },
    { email: "owner7@gemach.app", name: "Yossi Stein", phone: "(312) 555-0107", city: "Chicago", state: "IL", bio: "Seforim lending library.", avatarColor: "indigo" },
    { email: "owner8@gemach.app", name: "Esther Levy", phone: "(647) 555-0108", city: "Toronto", state: "ON", bio: "Furniture and household goods.", avatarColor: "orange" },
  ];

  const owners: Record<string, any> = {};
  for (const o of ownerData) {
    owners[o.email] = await prisma.user.create({
      data: { ...o, password: hash },
    });
  }

  // ── Gemachs ────────────────────────────────────────────
  const defaultHours = JSON.stringify([
    { day: 0, open: "09:00", close: "21:00", closed: false },
    { day: 1, open: "09:00", close: "21:00", closed: false },
    { day: 2, open: "09:00", close: "21:00", closed: false },
    { day: 3, open: "09:00", close: "21:00", closed: false },
    { day: 4, open: "09:00", close: "14:00", closed: false },
    { day: 5, open: "00:00", close: "00:00", closed: true },
    { day: 6, open: "09:00", close: "12:00", closed: false },
  ]);

  const gemachData = [
    {
      name: "Chesed Baby Gemach",
      category: "baby",
      description: "Providing baby essentials including clothing, gear, and supplies to families in need. We stock newborn through toddler sizes and accept donations of gently used items.",
      address: "1234 50th Street",
      city: "Brooklyn", state: "NY", zip: "11219",
      phone: "(718) 555-1001", email: "chesedbaby@gemach.app",
      hours: defaultHours,
      needs: JSON.stringify(["Newborn clothing (0-3mo)", "Diapers (all sizes)", "Baby carriers", "Swaddles and blankets"]),
      pickupNotes: "Call ahead to schedule. Pickup at side entrance on 50th St.",
      dropoff: true, delivery: false, apptOnly: true, verified: true, familiesHelped: 342,
      ownerId: demo.id,
    },
    {
      name: "Kallah Kollel Gowns",
      category: "simcha",
      description: "Beautiful wedding gowns and bridesmaid dresses available to borrow free of charge. Over 200 gowns in all sizes. Alterations not included. Also have veils and accessories.",
      address: "456 Cedar Bridge Ave",
      city: "Lakewood", state: "NJ", zip: "08701",
      phone: "(732) 555-1002", email: "gowns@gemach.app",
      hours: defaultHours,
      needs: JSON.stringify(["Gowns in sizes 14+", "Maternity wedding gowns", "Petite sizes", "Veils and tiaras"]),
      pickupNotes: "Enter through main lobby. Gown room is on 2nd floor.",
      dropoff: true, delivery: false, apptOnly: true, verified: true, familiesHelped: 189,
      ownerId: owners["owner2@gemach.app"].id,
    },
    {
      name: "Bikur Cholim Medical Equipment",
      category: "medical",
      description: "Lending wheelchairs, walkers, crutches, hospital beds, shower chairs, commodes, and other medical equipment. Free of charge for as long as needed.",
      address: "789 Route 59",
      city: "Monsey", state: "NY", zip: "10952",
      phone: "(845) 555-1003", email: "medical@gemach.app",
      hours: defaultHours,
      needs: JSON.stringify(["Wheelchairs", "Shower chairs", "Hospital beds", "Knee scooters"]),
      pickupNotes: "Warehouse entrance around back. Please bring help for heavy items.",
      dropoff: true, delivery: true, apptOnly: false, verified: true, familiesHelped: 1204,
      ownerId: owners["owner3@gemach.app"].id,
    },
    {
      name: "Kitchen Starter Gemach",
      category: "household",
      description: "Helping new couples and families set up their kitchens. Pots, pans, dishes, cutlery, small appliances, and more. Everything you need to cook your first Shabbos.",
      address: "321 Passaic Ave",
      city: "Passaic", state: "NJ", zip: "07055",
      phone: "(973) 555-1004", email: "kitchen@gemach.app",
      hours: defaultHours,
      needs: JSON.stringify(["Pots and pans sets", "Mixing bowls", "Small appliances", "Shabbos urns"]),
      pickupNotes: "Residential pickup. Ring bell for basement entrance.",
      dropoff: true, delivery: false, apptOnly: true, verified: false, familiesHelped: 78,
      ownerId: owners["owner4@gemach.app"].id,
    },
    {
      name: "Yad Ezra Clothing Gemach",
      category: "clothing",
      description: "Clothing for men, women, and children. Shabbos wear, weekday wear, coats, shoes, and accessories. All items clean and in good condition. Discrete and respectful service.",
      address: "567 Reisterstown Rd",
      city: "Baltimore", state: "MD", zip: "21208",
      phone: "(410) 555-1005",
      hours: defaultHours,
      needs: JSON.stringify(["Boys suits (sizes 8-16)", "Girls Shabbos dresses", "Maternity clothing", "Winter coats"]),
      pickupNotes: "Parking in rear. Use back entrance during open hours.",
      dropoff: true, delivery: false, apptOnly: false, verified: true, familiesHelped: 0,
      ownerId: owners["owner5@gemach.app"].id,
    },
    {
      name: "Tomchei Shabbos LA",
      category: "food",
      description: "Providing Shabbos and Yom Tov food packages to families facing hardship. Complete meals including challah, fish, soup, chicken, sides, and dessert. All deliveries are completely anonymous.",
      address: "8900 Pico Blvd",
      city: "Los Angeles", state: "CA", zip: "90035",
      phone: "(323) 555-1006", email: "la@gemach.app",
      hours: defaultHours,
      needs: JSON.stringify(["Non-perishable food items", "Gift cards to kosher markets", "Volunteer drivers"]),
      pickupNotes: "Food packages are delivered; no pickup available.",
      dropoff: false, delivery: true, apptOnly: false, verified: true, familiesHelped: 567,
      ownerId: owners["owner6@gemach.app"].id,
    },
    {
      name: "Ohr HaTorah Seforim Library",
      category: "seforim",
      description: "Lending library of seforim including Gemaras, Mishnayos, Chumashim, halacha seforim, mussar, and more. Great for learners who need temporary access to reference seforim.",
      address: "2345 W Devon Ave",
      city: "Chicago", state: "IL", zip: "60659",
      phone: "(312) 555-1007", email: "seforim@gemach.app",
      hours: defaultHours,
      needs: JSON.stringify(["Full Gemara sets", "Mishnah Berurah sets", "English seforim for beginners", "Artscroll sets"]),
      pickupNotes: "Library is in the shul basement. Hours may vary for Yom Tov.",
      dropoff: true, delivery: false, apptOnly: false, verified: true, familiesHelped: 0,
      ownerId: owners["owner7@gemach.app"].id,
    },
    {
      name: "Furniture Chesed Fund",
      category: "furniture",
      description: "Free furniture for families setting up new homes. Beds, tables, chairs, couches, bookcases, and more. We also help with moving and setup when volunteers are available.",
      address: "890 Bathurst St",
      city: "Toronto", state: "ON", zip: "M5V 2R4",
      phone: "(647) 555-1008", email: "furniture@gemach.app",
      hours: defaultHours,
      needs: JSON.stringify(["Bed frames and mattresses", "Dining tables", "Dressers", "Bookcases"]),
      pickupNotes: "Warehouse at rear of building. Loading dock available.",
      dropoff: true, delivery: true, apptOnly: true, verified: false, familiesHelped: 156,
      ownerId: owners["owner8@gemach.app"].id,
    },
    {
      name: "Party & Simcha Supplies",
      category: "party",
      description: "Tables, chairs, tablecloths, centerpieces, chuppah poles, and more for your simcha. Borrow everything you need for a bar mitzvah, bris, or vort.",
      address: "345 Central Ave",
      city: "Brooklyn", state: "NY", zip: "11221",
      phone: "(718) 555-1009", email: "party@gemach.app",
      hours: defaultHours,
      needs: JSON.stringify(["Folding tables (6ft)", "Folding chairs", "White tablecloths", "Chuppah poles and canopy"]),
      pickupNotes: "Garage pickup. Pull into driveway and honk.",
      dropoff: true, delivery: false, apptOnly: true, verified: true, familiesHelped: 0,
      ownerId: owners["owner1@gemach.app"].id,
    },
    {
      name: "Tools & Equipment Share",
      category: "tools",
      description: "Borrow tools for home repairs and projects. Drills, saws, ladders, painting equipment, and more. Why buy when you can borrow?",
      address: "12 Eileen Terrace",
      city: "Monroe", state: "NY", zip: "10950",
      phone: "(845) 555-1010",
      hours: defaultHours,
      needs: JSON.stringify(["Power drills", "Ladders (6ft+)", "Paint sprayers", "Cordless tools"]),
      pickupNotes: "Tools are stored in the shed. Please return clean.",
      dropoff: true, delivery: false, apptOnly: true, verified: false, familiesHelped: 0,
      ownerId: owners["owner3@gemach.app"].id,
    },
    {
      name: "Bikur Cholim of Miami",
      category: "bikur",
      description: "Visiting the sick, providing meals to hospital patients, arranging transportation to medical appointments, and lending medical equipment in the Miami Beach area.",
      address: "4201 Collins Ave",
      city: "Miami Beach", state: "FL", zip: "33140",
      phone: "(305) 555-1011", email: "miami@gemach.app",
      hours: defaultHours,
      needs: JSON.stringify(["Volunteer visitors", "Hospital meal deliveries", "Transportation volunteers", "Wheelchairs"]),
      pickupNotes: "Contact us for hospital room deliveries.",
      dropoff: false, delivery: true, apptOnly: false, verified: true, familiesHelped: 890,
      ownerId: owners["owner5@gemach.app"].id,
    },
    {
      name: "Free Loan Fund of Cleveland",
      category: "loan",
      description: "Interest-free loans for community members facing financial hardship. Loans up to $5,000 for rent, medical bills, tuition, or emergencies. Completely confidential and dignified process.",
      address: "2200 S Green Rd",
      city: "Cleveland", state: "OH", zip: "44121",
      phone: "(216) 555-1012", email: "loanfund@gemach.app",
      hours: defaultHours,
      needs: JSON.stringify(["Donations to the loan fund", "Board members", "Volunteer application reviewers"]),
      pickupNotes: "Office hours by appointment. Apply online or in person.",
      dropoff: false, delivery: false, apptOnly: true, verified: true, familiesHelped: 234,
      ownerId: owners["owner4@gemach.app"].id,
    },
  ];

  const gemachs: any[] = [];
  for (const g of gemachData) {
    gemachs.push(await prisma.gemach.create({ data: g }));
  }

  // ── Offers ─────────────────────────────────────────────
  const offerData = [
    { gemachId: gemachs[0].id, userId: owners["owner2@gemach.app"].id, items: "Baby clothes (0-6mo), 3 swaddles", qty: 1, method: "dropoff", preferredDate: "2026-08-07", note: "All items washed and folded.", status: "pending" },
    { gemachId: gemachs[1].id, userId: owners["owner4@gemach.app"].id, items: "Wedding gown, size 10, worn once", qty: 1, method: "dropoff", preferredDate: "2026-08-14", note: "Professionally cleaned. Includes veil.", status: "accepted" },
    { gemachId: gemachs[2].id, userId: demo.id, items: "Wheelchair (standard), shower chair", qty: 2, method: "pickup", preferredDate: "2026-08-03", note: "Need to borrow for about 3 weeks post-surgery.", status: "pending" },
    { gemachId: gemachs[3].id, userId: owners["owner6@gemach.app"].id, items: "Pots and pans set (10pc)", qty: 1, method: "dropoff", preferredDate: null, note: "Slightly used but in great condition.", status: "completed" },
    { gemachId: gemachs[5].id, userId: owners["owner7@gemach.app"].id, items: "Case of canned goods, 5 boxes of pasta", qty: 2, method: "dropoff", note: "Can drop off Sunday morning.", status: "accepted" },
    { gemachId: gemachs[0].id, userId: owners["owner3@gemach.app"].id, items: "Diapers (size 1), 2 packs", qty: 2, method: "dropoff", preferredDate: "2026-08-10", note: "Unopened packs.", status: "pending" },
    { gemachId: gemachs[7].id, userId: demo.id, items: "Dining table + 4 chairs", qty: 1, method: "pickup", preferredDate: "2026-08-05", note: "Moving and need these for new apartment.", status: "declined" },
  ];

  for (const o of offerData) {
    await prisma.offer.create({ data: o });
  }

  // ── Threads + Messages ────────────────────────────────
  const thread1 = await prisma.thread.create({
    data: { gemachId: gemachs[0].id, ownerId: demo.id, userId: owners["owner2@gemach.app"].id },
  });
  await prisma.message.createMany({
    data: [
      { threadId: thread1.id, senderId: owners["owner2@gemach.app"].id, body: "Hi! I have some baby clothes to donate. What sizes do you currently need most?" },
      { threadId: thread1.id, senderId: demo.id, body: "Thank you so much! We're especially low on newborn and 0-3 month sizes right now." },
      { threadId: thread1.id, senderId: owners["owner2@gemach.app"].id, body: "Perfect — I have a box of 0-3 month onesies and sleepers. Can I drop off Thursday?" },
      { threadId: thread1.id, senderId: demo.id, body: "Thursday works great! Any time between 10am and 3pm. Use the side entrance on 50th St." },
    ],
  });

  const thread2 = await prisma.thread.create({
    data: { gemachId: gemachs[2].id, ownerId: owners["owner3@gemach.app"].id, userId: demo.id },
  });
  await prisma.message.createMany({
    data: [
      { threadId: thread2.id, senderId: demo.id, body: "Shalom — I need to borrow a wheelchair and shower chair for about 3 weeks after a surgery next month." },
      { threadId: thread2.id, senderId: owners["owner3@gemach.app"].id, body: "Refuah sheleimah! We have both available. When would you like to pick them up?" },
      { threadId: thread2.id, senderId: demo.id, body: "Could I come by Sunday morning around 10am?" },
    ],
  });

  const thread3 = await prisma.thread.create({
    data: { gemachId: gemachs[5].id, ownerId: owners["owner6@gemach.app"].id, userId: owners["owner7@gemach.app"].id },
  });
  await prisma.message.createMany({
    data: [
      { threadId: thread3.id, senderId: owners["owner7@gemach.app"].id, body: "I'd like to donate some non-perishable food items. Where should I drop them off?" },
      { threadId: thread3.id, senderId: owners["owner6@gemach.app"].id, body: "That's wonderful, thank you! You can drop off at the shul office on Pico Blvd, Monday-Thursday 9-5." },
    ],
  });

  // ── Favorites ──────────────────────────────────────────
  await prisma.favorite.createMany({
    data: [
      { userId: demo.id, gemachId: gemachs[1].id },
      { userId: demo.id, gemachId: gemachs[4].id },
      { userId: demo.id, gemachId: gemachs[6].id },
      { userId: owners["owner2@gemach.app"].id, gemachId: gemachs[0].id },
      { userId: owners["owner4@gemach.app"].id, gemachId: gemachs[2].id },
    ],
  });

  console.log("✅ Seed complete!");
  console.log("   Demo login: demo@gemach.app / demo1234");
  console.log(`   ${ownerData.length + 1} users, ${gemachData.length} gemachs, ${offerData.length} offers, 3 conversations`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
