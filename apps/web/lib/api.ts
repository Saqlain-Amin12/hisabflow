const BASE = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1`;

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail ?? "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // Auth
  register: (body: { username: string; email: string; password: string; display_name?: string }) =>
    req<{ ok: boolean; message: string }>("POST", "/auth/register", body),

  login: (body: { username_or_email: string; password: string }) =>
    req<{ username: string; display_name: string | null; email: string | null }>("POST", "/auth/login", body),

  verifyEmail: (token: string) =>
    req<{ ok: boolean }>("POST", "/auth/verify-email", { token }),

  resendVerification: (email: string) =>
    req<{ ok: boolean }>("POST", "/auth/resend-verification", { email }),

  // Profile
  getProfile: (username: string) =>
    req<{ username: string; display_name: string | null; email: string | null }>("GET", `/profiles/${username}`),

  changeUsername: (username: string, newUsername: string) =>
    req<{ username: string; display_name: string | null; email: string | null; username_changed_at: string | null }>("POST", `/profiles/${username}/change-username`, { new_username: newUsername }),

  changePassword: (username: string, currentPassword: string, newPassword: string) =>
    req<{ username: string }>("POST", `/profiles/${username}/change-password`, { current_password: currentPassword, new_password: newPassword }),

  // Ledgers
  listLedgers: (username: string) =>
    req<LedgerListItem[]>("GET", `/ledgers?username=${encodeURIComponent(username)}`),

  getLedger: (id: string) =>
    req<LedgerDetail>("GET", `/ledgers/${id}`),

  createLedger: (body: { name: string; owner_username: string }) =>
    req<LedgerListItem>("POST", "/ledgers", body),

  renameLedger: (id: string, username: string, name: string) =>
    req<LedgerListItem>("PATCH", `/ledgers/${id}?username=${encodeURIComponent(username)}`, { name }),

  deleteLedger: (id: string, username: string) =>
    req<void>("DELETE", `/ledgers/${id}?username=${encodeURIComponent(username)}`),

  joinLedger: (id: string, body: { username: string; display_name: string }) =>
    req<unknown>("POST", `/ledgers/${id}/join`, body),

  leaveLedger: (id: string, username: string) =>
    req<void>("DELETE", `/ledgers/${id}/members/${username}`),

  addEntry: (ledgerId: string, body: {
    description: string; total_amount: number; paid_by: string; created_by: string;
    participants: string[]; shares: Record<string, number>; entry_date?: string;
  }) => req<unknown>("POST", `/ledgers/${ledgerId}/entries`, body),

  deleteEntry: (ledgerId: string, entryId: string, username: string) =>
    req<void>("DELETE", `/ledgers/${ledgerId}/entries/${entryId}?username=${encodeURIComponent(username)}`),

  updateEntry: (ledgerId: string, entryId: string, body: {
    description: string; total_amount: number; paid_by: string;
    participants: string[]; shares: Record<string, number>; username: string;
  }) => req<unknown>("PATCH", `/ledgers/${ledgerId}/entries/${entryId}`, body),

  closeMonth: (ledgerId: string, username: string, month?: string) =>
    req<unknown>("POST", `/ledgers/${ledgerId}/months/close`, { username, month }),

  reopenMonth: (ledgerId: string, username: string, month?: string) =>
    req<unknown>("POST", `/ledgers/${ledgerId}/months/reopen`, { username, month }),

  getActivities: (ledgerId: string) =>
    req<ActivityLog[]>("GET", `/ledgers/${ledgerId}/activities`),
};

export interface ActivityLog {
  id: string;
  username: string;
  action: string;
  entry_description: string | null;
  entry_amount: number | null;
  entry_date: string | null;
  created_at: string;
}

export interface LedgerListItem {
  id: string;
  name: string;
  status: string;
  owner_username: string;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface LedgerMember {
  id: string;
  username: string;
  display_name: string;
  role: string;
  joined_at: string;
}

export interface EntryParticipant {
  username: string;
  share_amount: number;
}

export interface LedgerEntry {
  id: string;
  entry_date: string;
  amount: number;
  description: string | null;
  paid_by: string;
  created_by: string;
  created_at: string;
  participants: EntryParticipant[];
}

export interface LedgerMonth {
  id: string;
  ledger_id: string;
  month: string;
  status: string;
  closed_at: string | null;
  closed_by: string | null;
  created_at: string;
}

export interface LedgerDetail extends LedgerListItem {
  members: LedgerMember[];
  entries: LedgerEntry[];
  months: LedgerMonth[];
}
