/**
 * Server-side authentication utilities with retry logic
 * to handle transient auth failures gracefully
 */

import { createSupabaseServerClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

interface AuthResult {
  user: User;
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
}

/**
 * Get authenticated user with retry logic and automatic redirect
 * Use this instead of direct supabase.auth.getUser() calls
 * 
 * @param maxRetries - Number of retry attempts (default: 2)
 * @returns AuthResult with user and supabase client
 * @throws Redirects to /login if authentication fails after retries
 */
export async function requireAuth(maxRetries = 2): Promise<AuthResult> {
  const supabase = await createSupabaseServerClient();

  let user: User | null = null;
  let lastError: Error | null = null;
  let attempts = 0;

  while (attempts <= maxRetries && !user) {
    try {
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        lastError = error;
        if (attempts < maxRetries) {
          console.warn(
            `[Auth] Attempt ${attempts + 1}/${maxRetries + 1} failed:`,
            error.message
          );
          attempts++;
          // Small delay before retry
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }
      }
      
      user = data.user;
      break;
    } catch (err) {
      lastError = err as Error;
      console.error(`[Auth] Exception on attempt ${attempts + 1}:`, err);
      attempts++;
      if (attempts <= maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  // Only redirect if we're certain there's no valid session after retries
  if (!user) {
    console.error(
      '[Auth] Authentication failed after',
      attempts,
      'attempts. Redirecting to login.',
      lastError?.message
    );
    redirect('/login');
  }

  return { user, supabase };
}

/**
 * Get authenticated user without automatic redirect
 * Use when you want to handle missing auth yourself
 * 
 * @param maxRetries - Number of retry attempts (default: 2)
 * @returns User or null if not authenticated
 */
export async function getAuthUser(maxRetries = 2): Promise<User | null> {
  const supabase = await createSupabaseServerClient();

  let user: User | null = null;
  let attempts = 0;

  while (attempts <= maxRetries && !user) {
    try {
      const { data, error } = await supabase.auth.getUser();
      
      if (error && attempts < maxRetries) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }
      
      user = data.user;
      break;
    } catch (err) {
      attempts++;
      if (attempts <= maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  return user;
}
