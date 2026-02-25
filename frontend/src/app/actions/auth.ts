"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { findByUsername } from "@/lib/dal/admins";
import { createSession, deleteSession } from "@/lib/session";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export async function login(_prevState: unknown, formData: FormData) {
  const validatedFields = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { username, password } = validatedFields.data;

  const admin = await findByUsername(username);
  if (!admin) {
    return {
      errors: {
        username: ["Invalid username or password"],
      },
    };
  }

  const passwordMatch = await bcrypt.compare(password, admin.password_hash);
  if (!passwordMatch) {
    return {
      errors: {
        username: ["Invalid username or password"],
      },
    };
  }

  await createSession(admin.id, admin.username);
  redirect("/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
