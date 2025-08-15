import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { useAppState, Status, GlobalRole, Ticket as AppStateTicket } from "@/context/AppState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const severities = ["Very High", "High", "Medium", "Low", "Easy"];

interface ReviewDetailsPopupProps {
  ticket: AppStateTicket;
  onSave: (
    ticket: AppStateTicket,
    ...args: (string | number)[]
  ) => Promise<void>;
  globalRole: GlobalRole;
}

const ReviewDetailsPopup = ({ ticket, onSave, globalRole }: ReviewDetailsPopupProps) => {
  const [newSeverity, setNewSeverity] = useState<string>(ticket.severity);
  const [reason, setReason] = useState<string>("");

  const [newTitle, setNewTitle] = useState<string>(ticket.title);
  const [newDescription, setNewDescription] = useState<string>(ticket.description);

  const handleSave = async () => {
    if (globalRole === "MANAGER") {
      await onSave(ticket, newSeverity, reason);
    } else if (globalRole === "ASSOCIATE") {
      await onSave(ticket, newTitle, newDescription);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          {globalRole === "MANAGER" ? "Review" : "Edit"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{globalRole === "MANAGER" ? `Review Ticket #${ticket.number}` : `Edit Ticket #${ticket.number}`}</DialogTitle>
          <DialogDescription>
            {globalRole === "MANAGER" ? "Adjust the severity and provide a reason for the change." : "Update the ticket's title and description."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {globalRole === "MANAGER" && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="severity" className="text-right">Severity</Label>
                <select
                  id="severity"
                  className="col-span-3 border rounded-md p-2"
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value)}
                >
                  {severities.map(s => (
                    <option key={s} value={s.toUpperCase().replace(/\s/g, '_')}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="reason" className="text-right">Reason</Label>
                <Input
                  id="reason"
                  className="col-span-3"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </>
          )}
          {globalRole === "ASSOCIATE" && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Title</Label>
                <Input
                  id="title"
                  className="col-span-3"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Description</Label>
                <Textarea
                  id="description"
                  className="col-span-3"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={false}>
            Save changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};


const statusOrder: Status[] = ["DRAFT", "REVIEW", "PENDING", "OPEN", "CLOSED"];

const displayStatusName = (status: Status) => {
  switch (status) {
    case "DRAFT": return "Draft";
    case "REVIEW": return "Review";
    case "PENDING": return "Pending";
    case "OPEN": return "Open";
    case "CLOSED": return "Closed";
    default: return status;
  }
};

interface ApiTicket {
  uuid: string;
  ticketNumber: number;
  title: string;
  description: string;
  severity: string;
  status: Status;
  dueDate: string | null;
  workspaceUuid: string;
  createdByUuid: string;
}

export default function Tickets() {
  const { tickets, activeWorkspaceId, globalRole, setTickets, backendUrl } = useAppState();
  const { toast } = useToast();
  const { token, user } = useAuth();

  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchTicketsFromApi = async (workspaceId: string, authToken: string): Promise<AppStateTicket[]> => {
    const res = await fetch(`${backendUrl}/ticket/get-all/${workspaceId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch tickets: ${res.status}`);
    }
    const json = await res.json();
    return json.data.map((t: ApiTicket) => ({
      id: t.uuid,
      number: t.ticketNumber,
      title: t.title,
      description: t.description,
      severity: t.severity,
      status: t.status,
      dueDate: t.dueDate,
      workspaceId: t.workspaceUuid,
      createdBy: t.createdByUuid,
    }));
  };

  useEffect(() => {
    document.title = "Tickets by status | Service Tickets";

    async function loadTickets() {
      if (!activeWorkspaceId || !token) return;
      try {
        const data = await fetchTicketsFromApi(activeWorkspaceId, token);
        setTickets(data);
      } catch (err) {
        toast({ title: "Error", description: "Failed to load tickets." });
        console.error(err);
      }
    }

    loadTickets();
  }, [activeWorkspaceId, token, toast, setTickets, backendUrl]);


  const filteredByWs = useMemo(() => {
    if (globalRole === "ASSOCIATE" && user) {
      return tickets.filter((t) => t.workspaceId === activeWorkspaceId && t.createdBy === user.uuid);
    }
    return tickets.filter((t) => t.workspaceId === activeWorkspaceId);
  }, [tickets, activeWorkspaceId, globalRole, user]);


  const grouped = useMemo(
    () =>
      statusOrder.reduce((acc, s) => {
        acc[s] = filteredByWs.filter((t) => t.status === s);
        return acc;
      }, { DRAFT: [], REVIEW: [], PENDING: [], OPEN: [], CLOSED: [] } as Record<Status, AppStateTicket[]>),
    [filteredByWs]
  );

  // --- ACTIONS ---

  const approveTicket = async (ticket: AppStateTicket) => {
    if (!token || !user) {
      toast({ title: "Authentication Error", description: "You must be logged in to perform this action.", variant: "destructive" });
      return;
    }

    if (ticket.createdBy === user.uuid) {
      toast({ title: "Action Forbidden", description: "Managers cannot approve their own tickets.", variant: "destructive" });
      return;
    }

    setIsActionLoading(true);
    try {
      const payload = {
        ticketUuid: ticket.id,
        managerUuid: user.uuid,
      };

      const res = await fetch(`${backendUrl}/ticket/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Failed to approve ticket: ${res.status}`);
      }

      const json = await res.json();
      toast({ title: "Approval Successful", description: json.message });
      const updatedTickets = await fetchTicketsFromApi(activeWorkspaceId, token);
      setTickets(updatedTickets);

    } catch (error) {
      console.error("Approval failed:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({ title: "Approval Failed", description: `Could not approve ticket: ${errorMessage}`, variant: "destructive" });
    } finally {
      setIsActionLoading(false);
    }
  };

  const reviewTicket = async (ticket: AppStateTicket, newSeverity: string, reviewReason: string) => {
    if (!token || !user) {
      toast({ title: "Authentication Error", description: "You must be logged in to perform this action.", variant: "destructive" });
      return;
    }

    if (ticket.createdBy === user.uuid) {
      toast({ title: "Action Forbidden", description: "Managers cannot review their own tickets.", variant: "destructive" });
      return;
    }

    setIsActionLoading(true);
    try {
      const payload = {
        ticketUuid: ticket.id,
        managerUuid: user.uuid,
        newSeverity: newSeverity,
        reason: reviewReason,
      };

      const res = await fetch(`${backendUrl}/ticket/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Failed to review ticket: ${res.status}`);
      }

      const json = await res.json();
      toast({ title: "Review Successful", description: json.message });
      const updatedTickets = await fetchTicketsFromApi(activeWorkspaceId, token);
      setTickets(updatedTickets);

    } catch (error) {
      console.error("Review failed:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({ title: "Review Failed", description: `Could not review ticket: ${errorMessage}`, variant: "destructive" });
    } finally {
      setIsActionLoading(false);
    }
  };

  const updateTicketDetails = async (ticket: AppStateTicket, newTitle: string, newDescription: string) => {
    if (!token || !user) {
      toast({ title: "Authentication Error", description: "You must be logged in to perform this action.", variant: "destructive" });
      return;
    }

    setIsActionLoading(true);
    try {
      const payload = {
        ticketUuid: ticket.id,
        associateUuid: user.uuid,
        title: newTitle,
        description: newDescription,
      };

      const res = await fetch(`${backendUrl}/ticket/update-details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ title: "Error on update", description: json.message, variant: "destructive"  });
     }else{
       toast({ title: "Update Successful", description: json.message});
       const updatedTickets = await fetchTicketsFromApi(activeWorkspaceId, token);
       setTickets(updatedTickets);
     }
    } catch (error) {
      console.error("Update failed:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({ title: "Update Failed", description: `Could not update ticket: ${errorMessage}`, variant: "destructive" });
    } finally {
      setIsActionLoading(false);
    }
  };


  const renderActionButton = (ticket: AppStateTicket) => {
    if (!user || !globalRole) {
      return <span className="text-gray-500">No Action</span>;
    }

    const isTicketCreator = user.uuid === ticket.createdBy;

    // Logic for Draft tickets
    if (ticket.status === "DRAFT") {
      return (
        <ReviewDetailsPopup
          ticket={ticket}
          onSave={updateTicketDetails}
          globalRole={globalRole}
        />
      );
    }

    // Logic for Review tickets
    else if (ticket.status === "REVIEW") {
      if (globalRole === "MANAGER") {
        const canApprove = !isTicketCreator;
        return (
          <div className="space-x-2">
            <ReviewDetailsPopup
              ticket={ticket}
              onSave={reviewTicket}
              globalRole={globalRole}
            />
            {canApprove && (
              <Button size="sm" variant="outline" onClick={() => approveTicket(ticket)} disabled={isActionLoading}>
                Approve
              </Button>
            )}
          </div>
        );
      }

      if (globalRole === "ASSOCIATE" && isTicketCreator) {
        return (
          <ReviewDetailsPopup
            ticket={ticket}
            onSave={updateTicketDetails}
            globalRole={globalRole}
          />
        );
      }
    }

    return <span className="text-gray-500">No Action</span>;
  };

  if (!user || !globalRole) {
    return (
      <Layout>
        <p className="text-center text-lg mt-10">Loading tickets...</p>
      </Layout>
    );
  }

  return (
    <Layout title="Tickets | Service Ticket System" description="Browse and manage tickets by status across workspaces.">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Tickets</h1>
          <Button asChild>
            <Link to="/create">Create Ticket</Link>
          </Button>
        </div>
        <Tabs defaultValue="DRAFT">
          <TabsList className="grid grid-cols-5 w-full">
            {statusOrder.map((s) => (
              <TabsTrigger key={s} value={s}>
                {displayStatusName(s)} ({grouped[s].length})
              </TabsTrigger>
            ))}
          </TabsList>

          {statusOrder.map((s) => (
            <TabsContent key={s} value={s}>
              <Card>
                <CardHeader>
                  <CardTitle>{displayStatusName(s)} Tickets</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Due</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grouped[s].map((t) => (
                        <TableRow key={t.id}>
                          <TableCell>{t.number}</TableCell>
                          <TableCell>{t.title}</TableCell>
                          <TableCell>{t.severity}</TableCell>
                          <TableCell>{t.dueDate ?? "-"}</TableCell>
                          <TableCell className="space-x-2">
                             {renderActionButton(t)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {grouped[s].length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No tickets in {displayStatusName(s)}.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </section>
    </Layout>
  );
}