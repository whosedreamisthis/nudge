import { SignOutButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { connection } from "next/server";
import { demoHoursLeft } from "@/lib/demo";
import { getSessionUser } from "@/lib/session";

// Under the Navbar for demo users only. Per user and per request, so it renders inside a Suspense boundary.
export async function DemoBanner() {
  await connection();
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) return null;

  const user = await getSessionUser();
  if (!user?.isDemo || !user.demoExpiresAt) return null;

  const hours = demoHoursLeft(user.demoExpiresAt, new Date());

  return (
    <div className="border-b border-border bg-secondary px-4 py-2 text-center text-sm text-secondary-foreground">
      Demo: your data will be deleted in {hours} {hours === 1 ? "hour" : "hours"}.{" "}
      {/* Signed-in visitors are redirected away from /register, so sign out on the way there */}
      <SignOutButton redirectUrl="/register">
        <button type="button" className="font-medium underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Register to keep your habits
        </button>
      </SignOutButton>
    </div>
  );
}
