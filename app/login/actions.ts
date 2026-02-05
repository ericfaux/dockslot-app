// app/login/actions.ts
"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";

export async function signInAction(formData: FormData): Promise<void> {
  const email = formData.get("email");
  const password = formData.get("password");

  // Validate required fields
  if (!email || typeof email !== "string" || !email.trim()) {
    redirect("/login?mode=signin&error=" + encodeURIComponent("Email is required"));
  }

  if (!password || typeof password !== "string" || !password.trim()) {
    redirect("/login?mode=signin&error=" + encodeURIComponent("Password is required"));
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: password,
  });

  if (error) {
    // Map common errors to user-friendly messages
    let message = "Unable to sign in. Please check your credentials.";

    if (error.message.toLowerCase().includes("invalid login credentials")) {
      message = "Invalid email or password. Please try again.";
    } else if (error.message.toLowerCase().includes("email not confirmed")) {
      message = "Please confirm your email address before signing in.";
    } else if (error.message.toLowerCase().includes("too many requests")) {
      message = "Too many attempts. Please wait a moment and try again.";
    }

    redirect("/login?mode=signin&error=" + encodeURIComponent(message));
  }

  // Check if captain has completed onboarding
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", (await supabase.auth.getUser()).data.user?.id)
    .single();

  if (!profile || !profile.onboarding_completed) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}

export async function registerAction(formData: FormData): Promise<void> {
  const businessName = formData.get("business_name");
  const email = formData.get("email");
  const password = formData.get("password");

  // Validate required fields
  if (!businessName || typeof businessName !== "string" || !businessName.trim()) {
    redirect("/login?mode=register&error=" + encodeURIComponent("Business name is required"));
  }

  if (!email || typeof email !== "string" || !email.trim()) {
    redirect("/login?mode=register&error=" + encodeURIComponent("Email is required"));
  }

  if (!password || typeof password !== "string" || !password.trim()) {
    redirect("/login?mode=register&error=" + encodeURIComponent("Password is required"));
  }

  if (password.length < 6) {
    redirect("/login?mode=register&error=" + encodeURIComponent("Password must be at least 6 characters"));
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signUp({
    email: email.trim(),
    password: password,
    options: {
      data: {
        business_name: businessName.trim(),
      },
    },
  });

  if (error) {
    // Map common errors to user-friendly messages
    let message = "Unable to create account. Please try again.";

    if (error.message.toLowerCase().includes("already registered")) {
      message = "An account with this email already exists. Try signing in instead.";
    } else if (error.message.toLowerCase().includes("invalid email")) {
      message = "Please enter a valid email address.";
    } else if (error.message.toLowerCase().includes("password")) {
      message = "Password does not meet requirements. Use at least 6 characters.";
    } else if (error.message.toLowerCase().includes("too many requests")) {
      message = "Too many attempts. Please wait a moment and try again.";
    }

    redirect("/login?mode=register&error=" + encodeURIComponent(message));
  }

  // New registrations always go to onboarding
  redirect("/onboarding");
}
