import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";

export function calculateAgeYMD(dob: Date): {
  years: number;
  months: number;
  days: number;
} {
  const today = new Date();
  const birthDate = new Date(dob);

  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();

  if (days < 0) {
    months -= 1;
    const previousMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += previousMonth.getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years, months, days };
}

export async function updateAllUsersAge() {
  try {
    console.log("[AGE UPDATER] Starting daily age calculation...");
    await connectToDatabase();

    // Find all users who have a dob set
    const users = await User.find({ dob: { $exists: true, $ne: null } });
    console.log(`[AGE UPDATER] Found ${users.length} users to update.`);

    for (const user of users) {
      if (user.dob) {
        const { years, months, days } = calculateAgeYMD(new Date(user.dob));

        // Only save if age changed or is not set
        const currentAge = user.age || {};
        if (
          currentAge.years !== years ||
          currentAge.months !== months ||
          currentAge.days !== days
        ) {
          user.age = { years, months, days };
          await user.save();
        }
      }
    }
    console.log("[AGE UPDATER] Daily age calculation complete.");
  } catch (error) {
    console.error("[AGE UPDATER] Error updating user ages:", error);
  }
}

declare global {
  var ageSchedulerStarted: boolean | undefined;
}

export function startAgeScheduler() {
  if (global.ageSchedulerStarted) {
    return;
  }
  global.ageSchedulerStarted = true;

  // Run immediately on start
  updateAllUsersAge();

  // Run every 24 hours
  setInterval(
    () => {
      updateAllUsersAge();
    },
    24 * 60 * 60 * 1000,
  );
}
