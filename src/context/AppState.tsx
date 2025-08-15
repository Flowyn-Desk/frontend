import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

export type Severity = "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW" | "EASY";
export type Status = "DRAFT" | "REVIEW" | "PENDING" | "OPEN" | "CLOSED";
export type GlobalRole = "MANAGER" | "ASSOCIATE";
export type WorkspaceRole = "member" | "owner" | "admin";

export interface Workspace {
  id: string;
  name: string;
  key: string;
}

export interface Membership {
  workspaceId: string;
  role: WorkspaceRole;
}

export interface Ticket {
  id: string;
  number: string;
  title: string;
  description: string;
  severity: Severity;
  status: Status;
  dueDate?: string;
  workspaceId: string;
  createdBy: string;
}

interface AppState {
  globalRole: GlobalRole;
  userId: string;
  workspaces: Workspace[];
  memberships: Membership[];
  activeWorkspaceId: string;
  setActiveWorkspace: (id: string) => void;

  tickets: Ticket[];
  setTickets: (tickets: Ticket[]) => void;
  createTicket: (input: Omit<Ticket, "id" | "number" | "status"> & { status?: Status }) => void;
  updateTicketStatus: (id: string, status: Status) => void;
  rotateWorkspaceKey: (workspaceId: string) => void;
  
  backendUrl: string;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

async function fetchUserWorkspaces(backendUrl, userId, token) {
  const res = await fetch(`${backendUrl}/workspaces/user/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch workspaces: ${res.status}`);
  }
  const json = await res.json();
  return json.data.map((w) => ({
    id: w.uuid,
    name: w.name,
    key: w.workspaceKey,
  }));
}

function pad(num, size) {
  let s = String(num);
  while (s.length < size) s = "0" + s;
  return s;
}

function generateTicketNumber(seq) {
  const year = new Date().getFullYear();
  return `TKT-${year}-${pad(seq, 6)}`;
}

function randomKey() {
  // simple mock secret
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function AppStateProvider({ children }) {
  const { user, token } = useAuth();
  
  const [globalRole, setGlobalRole] = useState("ASSOCIATE");
  const [userId, setUserId] = useState("");

  const [workspaces, setWorkspaces] = useState([]);
  const [memberships] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState("");
  const [tickets, setTickets] = useState([]);
  
  // Centralized backend URL
  const backendUrl = "http://localhost:3000";

  useEffect(() => {
    if (user && token) {
      setUserId(user.uuid);
      setGlobalRole(user.role as GlobalRole);
      fetchUserWorkspaces(backendUrl, user.uuid, token)
        .then((ws) => {
          setWorkspaces(ws);
          if (ws.length > 0) {
            setActiveWorkspaceId(ws[0].id);
          }
        })
        .catch((err) => {
          console.error("Failed to load workspaces", err);
        });
    }
  }, [user, token]);

  const [seq, setSeq] = useState(4);
  const createTicket = (input) => {
    const newTicket = {
      id: crypto.randomUUID(),
      number: generateTicketNumber(seq),
      title: input.title,
      description: input.description,
      severity: input.severity,
      status: input.status ?? "DRAFT",
      dueDate: input.dueDate,
      workspaceId: input.workspaceId,
      createdBy: input.createdBy,
    };
    setTickets((t) => [newTicket, ...t]);
    setSeq((s) => s + 1);
  };

  const updateTicketStatus = (id, status) => {
    setTickets((t) => t.map((tk) => (tk.id === id ? { ...tk, status } : tk)));
  };

  const rotateWorkspaceKey = (workspaceId) => {
    setWorkspaces((ws) => ws.map((w) => (w.id === workspaceId ? { ...w, key: randomKey() } : w)));
  };

  const value = {
    globalRole,
    userId,
    workspaces,
    memberships,
    activeWorkspaceId,
    setActiveWorkspace: setActiveWorkspaceId,

    tickets,
    setTickets,
    createTicket,
    updateTicketStatus,
    rotateWorkspaceKey,
    backendUrl,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
