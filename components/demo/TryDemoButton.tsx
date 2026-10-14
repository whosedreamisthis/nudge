"use client";

import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { startDemo } from "@/actions/demo";
import { Button } from "@/components/ui/button";

// Asks the server for a demo (new, or this visitor's existing one), then signs in with the
// one-time ticket it returns
interface TryDemoButtonProps {
  variant?: "default" | "secondary" | "outline";
  className?: string;
}

export function TryDemoButton({ variant = "secondary", className }: TryDemoButtonProps) {
  const { signIn } = useSignIn();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function start() {
    startTransition(async () => {
      const result = await startDemo({ timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      const { error: ticketError } = await signIn.ticket({ ticket: result.data.ticket });
      if (ticketError || signIn.status !== "complete") {
        toast.error("Could not sign in to the demo, please try again");
        return;
      }

      await signIn.finalize({
        navigate: ({ decorateUrl }) => {
          const url = decorateUrl("/today");
          if (url.startsWith("http")) window.location.href = url;
          else router.push(url);
        },
      });
    });
  }

  return (
    // Errors are toasts, so a failure never changes the layout of the row of buttons
    <Button variant={variant} className={className} onClick={start} disabled={pending}>
      {pending ? "Starting demo…" : "Try demo"}
    </Button>
  );
}
