const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const connectDB = require("../config/db");
const User = require("../models/User");

dotenv.config();

async function createAdmin() {
  await connectDB();

  const name = process.env.ADMIN_NAME || "B Donor Admin";
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env before running npm run create-admin.");
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    existing.isAdmin = true;
    existing.accountType = "admin";
    existing.status = "active";
    await existing.save();
    console.log(`Existing user promoted to admin: ${email}`);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await User.create({
    name,
    email,
    password: hashedPassword,
    accountType: "admin",
    isAdmin: true,
    isPatient: true,
    consent: {
      privacyAccepted: true,
      medicalDataAccepted: true,
      locationAccepted: true
    }
  });

  console.log(`Admin created: ${email}`);
}

createAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
