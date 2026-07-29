"use client";

import { create } from "zustand";
import { api, type LedgerDetail } from "@/lib/api";
import type { Ledger, LedgerEntry, DuesSummary } from "@/types/ledger";

// Map API snake_case response → frontend camelCase Ledger type
function mapDetail(d: LedgerDetail): Ledger {
  return {
    id: d.id,
    name: d.name,
    ownerUsername: d.owner_username,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
    members: d.members.map((m) => ({
      username: m.username,
      displayName: m.display_name,
      role: m.role as "owner" | "member",
      joinedAt: m.joined_at,
    })),
    months: d.months.map((m) => ({
      month: m.month,
      status: m.status as "open" | "closed",
      closedAt: m.closed_at ?? undefined,
      closedBy: m.closed_by ?? undefined,
    })),
    entries: d.entries.slice().sort((a, b) => {
      const d = a.entry_date.localeCompare(b.entry_date);
      return d !== 0 ? d : a.created_at.localeCompare(b.created_at);
    }).map((e) => {
      const shares: Record<string, number> = {};
      const participants: string[] = [];
      for (const p of e.participants) {
        shares[p.username] = p.share_amount;
        participants.push(p.username);
      }
      return {
        id: e.id,
        date: e.entry_date,
        month: e.entry_date.slice(0, 7),
        description: e.description ?? "",
        totalAmount: e.amount,
        paidBy: e.paid_by,
        participants,
        shares,
        createdAt: e.created_at,
      };
    }),
  };
}

export function calcDues(ledger: Ledger, month?: string): DuesSummary[] {
  const entries = month ? ledger.entries.filter((e) => e.month === month) : ledger.entries;
  return ledger.members.map((m) => {
    const totalPaid = entries
      .filter((e) => e.paidBy === m.username)
      .reduce((s, e) => s + e.totalAmount, 0);
    const totalDue = entries
      .reduce((s, e) => s + (e.shares[m.username] ?? 0), 0);
    const pending = totalPaid - totalDue;
    return {
      username: m.username,
      displayName: m.displayName,
      totalPaid,
      totalDue,
      pending,
      status: pending >= 0 ? "To Receive" : "To Pay",
    };
  });
}

interface LedgerState {
  ledgers: Ledger[];
  current: Ledger | null;
  loading: boolean;
  error: string | null;
  load: (username: string) => Promise<void>;
  loadOne: (id: string) => Promise<void>;
  create: (name: string, username: string, displayName: string) => Promise<Ledger | null>;
  join: (id: string, username: string, displayName: string) => Promise<string | null>;
  addEntry: (ledgerId: string, entry: Omit<LedgerEntry, "id" | "createdAt">) => Promise<string | null>;
  updateEntry: (ledgerId: string, entryId: string, entry: { description: string; totalAmount: number; paidBy: string; participants: string[]; shares: Record<string, number> }, username: string) => Promise<string | null>;
  deleteEntry: (ledgerId: string, entryId: string, username: string) => Promise<string | null>;
  closeMonth: (ledgerId: string, month: string, username: string) => Promise<void>;
  reopenMonth: (ledgerId: string, username: string, month?: string) => Promise<void>;
  rename: (ledgerId: string, name: string, username: string) => Promise<void>;
  deleteLedger: (ledgerId: string, username: string) => Promise<void>;
  leave: (ledgerId: string, username: string) => Promise<void>;
}

export const useLedgerStore = create<LedgerState>((set, get) => ({
  ledgers: [],
  current: null,
  loading: false,
  error: null,

  async load(username) {
    set({ loading: true, error: null });
    try {
      const list = await api.listLedgers(username);
      // Map list items to Ledger type (no entries/members in list)
      const ledgers: Ledger[] = list.map((l) => ({
        id: l.id,
        name: l.name,
        ownerUsername: l.owner_username,
        createdAt: l.created_at,
        updatedAt: l.updated_at,
        memberCount: l.member_count,
        members: [],
        months: [],
        entries: [],
      }));
      set({ ledgers, loading: false });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : "Failed to load ledgers." });
    }
  },

  async loadOne(id) {
    set({ loading: true, error: null });
    try {
      const detail = await api.getLedger(id);
      set({ current: mapDetail(detail), loading: false });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : "Failed to load ledger.", current: null });
    }
  },

  async create(name, username) {
    try {
      await api.createLedger({ name, owner_username: username });
      await get().load(username);
      // Return first ledger (newly created)
      return get().ledgers[0] ?? null;
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Failed to create ledger." });
      return null;
    }
  },

  async join(id, username, displayName) {
    try {
      await api.joinLedger(id, { username, display_name: displayName });
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "Failed to join ledger.";
    }
  },

  async addEntry(ledgerId, entry) {
    try {
      await api.addEntry(ledgerId, {
        description: entry.description,
        total_amount: entry.totalAmount,
        paid_by: entry.paidBy,
        created_by: entry.createdBy ?? entry.paidBy,
        participants: entry.participants,
        shares: entry.shares,
        entry_date: entry.date,
      });
      await get().loadOne(ledgerId);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "Failed to add entry.";
    }
  },

  async updateEntry(ledgerId, entryId, entry, username) {
    try {
      await api.updateEntry(ledgerId, entryId, {
        description: entry.description,
        total_amount: entry.totalAmount,
        paid_by: entry.paidBy,
        participants: entry.participants,
        shares: entry.shares,
        username,
      });
      await get().loadOne(ledgerId);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "Failed to update entry.";
    }
  },

  async deleteEntry(ledgerId, entryId, username) {
    try {
      await api.deleteEntry(ledgerId, entryId, username);
      await get().loadOne(ledgerId);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "Failed to delete entry.";
    }
  },

  async closeMonth(ledgerId, month, username) {
    try {
      await api.closeMonth(ledgerId, username, month);
      await get().loadOne(ledgerId);
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Failed to close month." });
    }
  },

  async reopenMonth(ledgerId, username, month) {
    try {
      await api.reopenMonth(ledgerId, username, month);
      await get().loadOne(ledgerId);
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Failed to reopen month." });
    }
  },

  async rename(ledgerId, name, username) {
    try {
      await api.renameLedger(ledgerId, username, name);
      await get().loadOne(ledgerId);
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Failed to rename ledger." });
    }
  },

  async deleteLedger(ledgerId, username) {
    try {
      await api.deleteLedger(ledgerId, username);
      set((s) => ({
        ledgers: s.ledgers.filter((l) => l.id !== ledgerId),
        current: s.current?.id === ledgerId ? null : s.current,
      }));
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Failed to delete ledger." });
    }
  },

  async leave(ledgerId, username) {
    try {
      await api.leaveLedger(ledgerId, username);
      set((s) => ({
        ledgers: s.ledgers.filter((l) => l.id !== ledgerId),
        current: s.current?.id === ledgerId ? null : s.current,
      }));
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Failed to leave ledger." });
    }
  },
}));
