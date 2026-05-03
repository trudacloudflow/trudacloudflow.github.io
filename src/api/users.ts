// src/api/users.ts
import { httpsCallable } from "firebase/functions";
import { functions } from "../lib/firebase";

export const inviteUser = async (
  email: string,
  role: "user" | "admin"
) => {
  try {
    const fn = httpsCallable(functions, "inviteUser");
    const res = await fn({ email, role });
    return res.data;
  } catch (err) {
    console.error("Invite failed:", err);
    throw err;
  }
};