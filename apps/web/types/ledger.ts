export type MemberRole = "owner" | "member";
export type MonthStatus = "open" | "closed";

export interface LedgerMember {
  username: string;
  displayName: string;
  role: MemberRole;
  joinedAt: string;
}

export interface LedgerEntry {
  id: string;
  date: string;        // YYYY-MM-DD
  month: string;       // YYYY-MM
  description: string;
  totalAmount: number;
  paidBy: string;      // username
  createdBy?: string;  // who submitted the entry
  participants: string[];             // usernames who participated
  shares: Record<string, number>;     // username -> share amount
  createdAt: string;
}

export interface LedgerMonth {
  month: string;       // YYYY-MM
  status: MonthStatus;
  closedAt?: string;
  closedBy?: string;
}

export interface Ledger {
  id: string;
  name: string;
  ownerUsername: string;
  memberCount?: number;
  members: LedgerMember[];
  months: LedgerMonth[];
  entries: LedgerEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface DuesSummary {
  username: string;
  displayName: string;
  totalPaid: number;
  totalDue: number;
  pending: number;     // totalPaid - totalDue  (positive = to receive)
  status: "To Receive" | "To Pay";
}
