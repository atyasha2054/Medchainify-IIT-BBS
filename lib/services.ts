import User from "@/models/User";
import { connectToDatabase } from "@/lib/db";

export async function getUserByEmail(email: string) {
  await connectToDatabase();
  const user = await User.findOne({ email });
  return user;
}

export async function getUserById(id: string) {
  await connectToDatabase();
  const user = await User.findById(id);
  return user;
}

export async function createUser(data: any) {
  await connectToDatabase();
  const newUser = await User.create(data);
  return newUser;
}
export async function updateUser(id: string, data: any) {
  await connectToDatabase();
  const updatedUser = await User.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true },
  );
  return updatedUser;
}
