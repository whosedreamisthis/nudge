"use client";

import { Dialog } from "@base-ui/react/dialog";
import { useClerk, useUser } from "@clerk/nextjs";
import { Bell, Moon, Settings, Sun, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useRef, useState, useTransition } from "react";
import { setAiEnabled, updateTimezone } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { DELETE_PHRASE, isDeleteConfirmed, timezoneOptions } from "@/lib/settings";
import { cn } from "@/lib/utils";

interface SettingsButtonProps {
  timezone: string;
  aiEnabled: boolean;
  // A demo is temporary: it keeps the theme and sign-out, nothing that persists or deletes
  isDemo: boolean;
}

const THEMES = [
  { id: "light", label: "Light", Icon: Sun },
  { id: "dark", label: "Dark", Icon: Moon },
] as const;

const FIELD_CLASS =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

// The gear in the Navbar, next to the profile button, and the modal it opens
export function SettingsButton(props: SettingsButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label="Settings"
        className="flex size-8 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Settings aria-hidden className="size-5" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Popup className="fixed inset-0 z-50 overflow-y-auto overscroll-contain scrollbar-none bg-popover p-5 text-popover-foreground sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-h-[90dvh] sm:w-[calc(100%-2rem)] sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:shadow-xl sm:ring-1 sm:ring-border">
          {/* Mounts on each open, so the form fields start from the saved values */}
          <SettingsContent {...props} onClose={() => setOpen(false)} />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function SettingsContent({
  timezone,
  aiEnabled,
  isDemo,
  onClose,
}: SettingsButtonProps & { onClose: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Dialog.Title className="text-lg font-semibold">Settings</Dialog.Title>
          <Dialog.Description className="text-sm text-muted-foreground">
            Your account and how Nudge looks and works.
          </Dialog.Description>
        </div>
        <Dialog.Close
          aria-label="Close"
          className="flex size-8 shrink-0 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X aria-hidden className="size-4" />
        </Dialog.Close>
      </div>

      <AccountSection onClose={onClose} />
      <ThemeSection />
      {!isDemo && (
        <>
          <TimezoneSection timezone={timezone} />
          <AiSection enabled={aiEnabled} />
          <RemindersSection />
          <DeleteSection />
        </>
      )}
    </div>
  );
}

function AccountSection({ onClose }: { onClose: () => void }) {
  const { openUserProfile, signOut } = useClerk();

  return (
    <Section title="Account">
      <div className="flex flex-wrap gap-2">
        {/* Clerk's profile has its own dialog, so close ours first */}
        <Button
          variant="outline"
          onClick={() => {
            onClose();
            openUserProfile();
          }}
        >
          Manage profile and email
        </Button>
        <Button variant="outline" onClick={() => signOut({ redirectUrl: "/" })}>
          Sign out
        </Button>
      </div>
    </Section>
  );
}

function ThemeSection() {
  // Until a theme is picked the app follows the OS, and resolvedTheme says which one that is
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Section title="Theme">
      <div role="radiogroup" aria-label="Theme" className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1 ring-1 ring-border">
        {THEMES.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={resolvedTheme === id}
            onClick={() => setTheme(id)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-sm px-2 py-1.5 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
              resolvedTheme === id
                ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon aria-hidden className="size-4" />
            {label}
          </button>
        ))}
      </div>
    </Section>
  );
}

function TimezoneSection({ timezone }: { timezone: string }) {
  const [value, setValue] = useState(timezone);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateTimezone(value);
      if (result.success) setSaved(true);
      else setError(result.error);
    });
  }

  return (
    <Section title="Timezone">
      <p className="text-sm text-muted-foreground">
        Decides when your day starts. Your history stays as it is, but today and your streaks follow the new timezone.
      </p>
      <select
        aria-label="Timezone"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(false);
        }}
        className={FIELD_CLASS}
      >
        {timezoneOptions(timezone).map((zone) => (
          <option key={zone} value={zone}>
            {zone}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={pending || value === timezone}>
          {pending ? "Saving…" : "Save timezone"}
        </Button>
        {saved && <span role="status" className="text-sm text-complete">Saved</span>}
        {error && <span role="alert" className="text-sm text-destructive">{error}</span>}
      </div>
    </Section>
  );
}

function AiSection({ enabled }: { enabled: boolean }) {
  const [on, setOn] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function toggle() {
    const next = !on;
    setOn(next);
    setError(null);
    startTransition(async () => {
      const result = await setAiEnabled(next);
      if (!result.success) {
        setOn(!next);
        setError(result.error);
      }
    });
  }

  return (
    <Section title="AI features">
      <div className="flex items-center justify-between gap-3">
        <p id="ai-label" className="text-sm">
          Weekly report, morning motivation and habit suggestions
        </p>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-labelledby="ai-label"
          onClick={toggle}
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring",
            on ? "bg-habit-emerald" : "bg-border",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform",
              on && "translate-x-5",
            )}
          />
        </button>
      </div>
      <p className="text-sm text-muted-foreground">
        When on, your habit names, completions and journal text are sent to Google&apos;s Gemini to write these.
      </p>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </Section>
  );
}

// A placeholder so the layout is settled; reminders themselves are not decided yet
function RemindersSection() {
  return (
    <Section title="Reminders">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Bell aria-hidden className="size-4" />
        Coming soon
      </div>
    </Section>
  );
}

function DeleteSection() {
  const { user } = useUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  // The button stays enabled: a wrong phrase says what is missing and puts the cursor in the field
  function remove(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    if (!isDeleteConfirmed(text)) {
      setError(`Type "${DELETE_PHRASE}" exactly to confirm.`);
      input.current?.focus();
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        // Clerk deletes the account, then our webhook removes the data. That can lag, so leave
        // the app straight away instead of showing a page for a user that is going away.
        await user.delete();
        router.push("/");
      } catch {
        setError("Couldn't delete your account. Try again.");
      }
    });
  }

  return (
    <Section title="Delete account">
      {!open ? (
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm text-muted-foreground">
            Permanently deletes your account and all of your habits and history.
          </p>
          <Button variant="destructive" onClick={() => setOpen(true)}>
            Delete account
          </Button>
        </div>
      ) : (
        <form onSubmit={remove} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span>
              This can&apos;t be undone. Type <strong>{DELETE_PHRASE}</strong> to confirm.
            </span>
            <input
              ref={input}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setError(null);
              }}
              autoFocus
              autoComplete="off"
              className={FIELD_CLASS}
            />
          </label>
          <div className="flex gap-2">
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "Deleting…" : "Delete my account"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setText("");
                setError(null);
              }}
              disabled={pending}
            >
              Cancel
            </Button>
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        </form>
      )}
    </Section>
  );
}
