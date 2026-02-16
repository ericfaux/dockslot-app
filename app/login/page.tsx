// app/login/page.tsx
import Link from "next/link";
import { signInAction, registerAction, forgotPasswordAction } from "./actions";

interface PageProps {
  searchParams: Promise<{ mode?: string; error?: string; success?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const mode = params.mode === "register" ? "register" : params.mode === "forgot" ? "forgot" : "signin";
  const error = params.error;
  const success = params.success;

  return (
    <main className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Left Panel — Product Promise */}
      <section className="bg-slate-900 px-8 py-12 lg:px-12 lg:py-16 lg:flex lg:flex-col lg:justify-center">
        <div className="max-w-lg">
          <header className="mb-10">
            <span className="text-xs font-bold uppercase tracking-wide text-white/50">
              DockSlot
            </span>
          </header>

          <h1 className="text-3xl font-bold leading-tight tracking-tight text-white lg:text-4xl xl:text-5xl">
            Your bookings.
            <br />
            Your schedule.
            <br />
            Your command.
          </h1>

          <p className="mt-6 max-w-sm text-base leading-relaxed text-white/70">
            The booking system built for working captains. No clutter, no
            confusion—just the tools you need to fill your calendar and run
            your operation.
          </p>

          <blockquote className="mt-12 border-l-2 border-white/30 pl-4">
            <p className="text-sm italic text-white/80">
              "Finally, software that respects my time. I spend less time on
              admin and more time on the water."
            </p>
            <footer className="mt-2 text-xs font-medium uppercase tracking-wide text-white/50">
              — Captain, Charleston SC
            </footer>
          </blockquote>
        </div>
      </section>

      {/* Right Panel — Form Workspace */}
      <section className="flex min-h-[70vh] flex-col justify-center bg-white px-8 py-12 lg:min-h-screen lg:px-12 lg:py-16">
        <div className="mx-auto w-full max-w-md">
          {/* Tabs */}
          <nav className="mb-8 flex border-b border-slate-200">
            <Link
              href="/login?mode=signin"
              className={`mr-8 pb-3 text-sm font-medium transition-colors ${
                mode === "signin" || mode === "forgot"
                  ? "border-b-2 border-slate-900 text-slate-900"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Sign In
            </Link>
            <Link
              href="/login?mode=register"
              className={`pb-3 text-sm font-medium transition-colors ${
                mode === "register"
                  ? "border-b-2 border-slate-900 text-slate-900"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Captain Registration
            </Link>
          </nav>

          {/* Error Box */}
          {error && (
            <div className="mb-6 border-l-4 border-red-500 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          {/* Success Box */}
          {success && (
            <div className="mb-6 border-l-4 border-green-500 bg-green-50 px-4 py-3">
              <p className="text-sm font-medium text-green-700">{success}</p>
            </div>
          )}

          {/* Sign In Form */}
          {mode === "signin" && (
            <form action={signInAction} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="h-12 w-full rounded-sm border border-slate-300 bg-white px-4 text-base text-slate-900 placeholder-slate-400 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                  placeholder="captain@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="h-12 w-full rounded-sm border border-slate-300 bg-white px-4 text-base text-slate-900 placeholder-slate-400 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                  placeholder="••••••••"
                />
                <div className="mt-1 text-right">
                  <Link
                    href="/login?mode=forgot"
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                className="h-12 w-full rounded-sm bg-slate-900 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
              >
                Sign In
              </button>

              <p className="text-center text-xs text-slate-500">
                Secure sign-in. We never share your email.
              </p>
            </form>
          )}

          {/* Forgot Password Form */}
          {mode === "forgot" && (
            <form action={forgotPasswordAction} className="space-y-6">
              <p className="text-sm text-slate-600">
                Enter your email address and we&apos;ll send you a link to reset
                your password.
              </p>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="h-12 w-full rounded-sm border border-slate-300 bg-white px-4 text-base text-slate-900 placeholder-slate-400 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                  placeholder="captain@example.com"
                />
              </div>

              <button
                type="submit"
                className="h-12 w-full rounded-sm bg-slate-900 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
              >
                Send Reset Link
              </button>

              <p className="text-center text-xs text-slate-500">
                <Link
                  href="/login?mode=signin"
                  className="text-slate-700 hover:text-slate-900"
                >
                  Back to sign in
                </Link>
              </p>
            </form>
          )}

          {/* Registration Form */}
          {mode === "register" && (
            <form action={registerAction} className="space-y-6">
              <div>
                <label
                  htmlFor="business_name"
                  className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  Business Name
                </label>
                <input
                  id="business_name"
                  name="business_name"
                  type="text"
                  autoComplete="organization"
                  required
                  className="h-12 w-full rounded-sm border border-slate-300 bg-white px-4 text-base text-slate-900 placeholder-slate-400 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                  placeholder="Charleston Charter Co."
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="h-12 w-full rounded-sm border border-slate-300 bg-white px-4 text-base text-slate-900 placeholder-slate-400 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                  placeholder="captain@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="h-12 w-full rounded-sm border border-slate-300 bg-white px-4 text-base text-slate-900 placeholder-slate-400 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                  placeholder="••••••••"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Minimum 6 characters
                </p>
              </div>

              <button
                type="submit"
                className="h-12 w-full rounded-sm bg-slate-900 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
              >
                Create Captain Account
              </button>

              <p className="text-center text-xs text-slate-500">
                Your data stays private. No marketing spam, ever.
              </p>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
