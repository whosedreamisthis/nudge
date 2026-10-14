import { SignUp } from "@clerk/nextjs";
import { TryDemoButton } from "@/components/demo/TryDemoButton";

// Creating a demo (Try demo, a Server Action on this page) takes a few seconds, so allow more than a host's default
export const maxDuration = 60;

export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center gap-6">
      <SignUp />
      <TryDemoButton />
    </div>
  );
}
