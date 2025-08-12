import { ReactNode, createContext, useContext, useMemo, useState } from "react";


// Types
export type Severity = "Very High" | "High" | "Medium" | "Low" | "Easy";
export type Status = "Draft" | "Review" | "Pending" | "Open" | "Closed";
export type GlobalRole = "associate" | "manager";
export type WorkspaceRole = "member" | "owner" | "admin";

export interface Workspace {
  id: string;
  name: string;
  key: string; // secret used for CSV export/import
}

export interface Membership {
  workspaceId: string;
  role: WorkspaceRole;
}

export interface Ticket {
  id: string; // UUID (here nanoid)
  number: string; // TKT-YYYY-XXXXXX (UI-only mock)
  title: string;
  description: string;
  severity: Severity;
  status: Status;
  dueDate?: string;
  workspaceId: string;
  createdBy: string; // user id/email (mock)
}

interface AppState {
  globalRole: GlobalRole; // fixed across workspaces
  userId: string;
  workspaces: Workspace[];
  memberships: Membership[];
  activeWorkspaceId: string;
  setActiveWorkspace: (id: string) => void;

  tickets: Ticket[];
  createTicket: (input: Omit<Ticket, "id" | "number" | "status"> & { status?: Status }) => void;
  updateTicketStatus: (id: string, status: Status) => void;
  rotateWorkspaceKey: (workspaceId: string) => void;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

async function fetchTicketsFromApi(workspaceId?: string) {
  const params = workspaceId ? `?workspaceId=${workspaceId}` : "";
  const res = await fetch(`/api/tickets${params}`);
  
  if (!res.ok) {
    throw new Error(`Failed to fetch tickets: ${res.status}`);
  }

  return res.json(); // assuming backend returns an array of tickets
}

function pad(num: number, size: number) {
  let s = String(num);
  while (s.length < size) s = "0" + s;
  return s;
}

function generateTicketNumber(seq: number) {
  const year = new Date().getFullYear();
  return `TKT-${year}-${pad(seq, 6)}`;
}

function randomKey() {
  // simple mock secret
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  // Mock user context
  const [globalRole] = useState<GlobalRole>("manager"); // change to "associate" to preview that role
  const [userId] = useState<string>("user@example.com");

  // Mock workspaces and memberships
  const [workspaces, setWorkspaces] = useState<Workspace[]>([
    { id: "ws-1", name: "Alpha Team", key: randomKey() },
    { id: "ws-2", name: "Beta Ops", key: randomKey() },
  ]);
  const [memberships] = useState<Membership[]>([
    { workspaceId: "ws-1", role: "owner" },
    { workspaceId: "ws-2", role: "member" },
  ]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>("ws-1");

  // Mock tickets scoped by workspace
  const initialTickets: Ticket[] = useMemo(
    () => [
      {
        id: crypto.randomUUID(),
        number: generateTicketNumber(1),
        title: "VPN not connecting",
        description: "Intermittent drops on corporate VPN.",
        severity: "Medium",
        status: "Draft",
        dueDate: undefined,
        workspaceId: "ws-1",
        createdBy: userId,
      },
      {
        id: crypto.randomUUID(),
        number: generateTicketNumber(2),
        title: "Billing export failed",
        description: "Nightly export job failed due to timeout.",
        severity: "High",
        status: "Pending",
        dueDate: undefined,
        workspaceId: "ws-1",
        createdBy: userId,
      },
      {
        id: crypto.randomUUID(),
        number: generateTicketNumber(3),
        title: "New laptop setup",
        description: "Provisioning MacBook for new hire.",
        severity: "Low",
        status: "Open",
        dueDate: undefined,
        workspaceId: "ws-2",
        createdBy: userId,
      },
    ],
    [userId]
  );

  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [seq, setSeq] = useState<number>(4);

  const createTicket: AppState["createTicket"] = (input) => {
    const newTicket: Ticket = {
      id: crypto.randomUUID(),
      number: generateTicketNumber(seq),
      title: input.title,
      description: input.description,
      severity: input.severity,
      status: input.status ?? "Draft",
      dueDate: input.dueDate,
      workspaceId: input.workspaceId,
      createdBy: input.createdBy,
    };
    setTickets((t) => [newTicket, ...t]);
    setSeq((s) => s + 1);
  };

  const updateTicketStatus: AppState["updateTicketStatus"] = (id, status) => {
    setTickets((t) => t.map((tk) => (tk.id === id ? { ...tk, status } : tk)));
  };

  const rotateWorkspaceKey: AppState["rotateWorkspaceKey"] = (workspaceId) => {
    setWorkspaces((ws) => ws.map((w) => (w.id === workspaceId ? { ...w, key: randomKey() } : w)));
  };

  const value: AppState = {
    globalRole,
    userId,
    workspaces,
    memberships,
    activeWorkspaceId,
    setActiveWorkspace: setActiveWorkspaceId,

    tickets,
    createTicket,
    updateTicketStatus,
    rotateWorkspaceKey,
    
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}