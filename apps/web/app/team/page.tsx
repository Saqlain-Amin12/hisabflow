"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLedgerStore } from "@/store/ledger-store";
import { CreateLedgerDialog } from "@/components/ledgers/create-ledger-dialog";
import { JoinLedgerDialog } from "@/components/ledgers/join-ledger-dialog";
import { useAuthGuard } from "@/lib/use-auth-guard";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export default function TeamPage() {
  const router = useRouter();
  const username = useAuthGuard();
  const { ledgers, load, loading, error } = useLedgerStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  useEffect(() => {
    if (username) void load(username);
  }, [username, load]);

  if (!username) return null; // redirecting

  return (
    <>
      <div className="team-page">
        <div style={{ width: "100%" }}>

          {/* Buttons row */}
          <div className="team-topbar">
            <button className="team-btn-create" onClick={() => setCreateOpen(true)}>Create Ledger</button>
            <button className="team-btn-join" onClick={() => setJoinOpen(true)}>Join Ledger</button>
          </div>

          {error && (
            <div style={{ background:"#fef2f2", border:"1px solid #fecaca", color:"#dc2626", borderRadius:10, padding:"10px 14px", fontSize:"0.84rem", marginBottom:12 }}>
              {error}
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className="team-empty" style={{ padding:"40px 20px" }}>
              <p style={{ color:"#9ca3af" }}>Loading ledgers…</p>
            </div>
          ) : ledgers.length === 0 ? (
            <div className="team-empty">
              <p>No Ledger Found</p>
              <span>Create your first ledger to start tracking shared expenses.</span>
              <button className="team-empty-btn" onClick={() => setCreateOpen(true)}>+ Create Ledger</button>
            </div>
          ) : (
            <div className="team-table-wrap">
            <table className="team-table" style={{borderRadius:0,border:"none"}}>
              <thead>
                <tr>
                  <th><span className="team-dot" />Ledger Name</th>
                  <th>Member</th>
                  <th>Created Date</th>
                  <th>View</th>
                </tr>
              </thead>
              <tbody>
                {ledgers.map((l) => (
                  <tr key={l.id}>
                    <td>{l.name}</td>
                    <td>{l.memberCount ?? l.members.length}</td>
                    <td>{formatDate(l.createdAt)}</td>
                    <td>
                      <button className="team-view-btn" aria-label={`View ${l.name}`} onClick={() => router.push(`/team/${l.id}`)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>

      <CreateLedgerDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
      <JoinLedgerDialog open={joinOpen} onClose={() => setJoinOpen(false)} />
    </>
  );
}
