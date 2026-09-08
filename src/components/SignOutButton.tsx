'use client';

// Sign-out keeps the original mechanism exactly: a POST to /api/auth/logout,
// which clears the cookie and 303s to /login. The only change is a
// confirmation step in front of it.
import { useRef, useState } from 'react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { IconLogout } from '@/components/icons';

export default function SignOutButton({
  className = 'btn-ghost btn-sm w-full',
  label = 'Sign out',
  showIcon = true,
}: {
  className?: string;
  label?: string;
  showIcon?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <>
      <form ref={formRef} action="/api/auth/logout" method="post" className="hidden" />

      <button type="button" className={className} onClick={() => setOpen(true)}>
        {showIcon && <IconLogout className="h-4 w-4" />}
        {label}
      </button>

      <ConfirmDialog
        open={open}
        busy={busy}
        title="Sign out of the admin panel?"
        description="Your session ends immediately and you will need to sign in again."
        confirmLabel="Sign out"
        tone="danger"
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setBusy(true);
          formRef.current?.requestSubmit();
        }}
      />
    </>
  );
}
