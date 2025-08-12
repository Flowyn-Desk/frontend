import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { useAppState, Status, GlobalRole } from "@/context/AppState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

// Corrected statusOrder to match backend enum values
const statusOrder: Status[] = ["DRAFT", "REVIEW", "PENDING", "OPEN", "CLOSED"];

// Helper function to map backend status to display text
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

export default function Tickets() {
  const { tickets, activeWorkspaceId, globalRole, setTickets, backendUrl } = useAppState();
  const { toast } = useToast();
  const { token, user } = useAuth();
  
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Helper function to fetch tickets from the backend
  const fetchTicketsFromApi = async (workspaceId, authToken) => {
    const res = await fetch(`${backendUrl}/ticket/get-all/${workspaceId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch tickets: ${res.status}`);
    }
    const json = await res.json();
    return json.data.map((t) => ({
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
  

  const filteredByWs = useMemo(() => tickets.filter((t) => t.workspaceId === activeWorkspaceId), [tickets, activeWorkspaceId]);

  const grouped = useMemo(
    () =>
      statusOrder.reduce((acc, s) => {
        acc[s] = filteredByWs.filter((t) => t.status === s);
        return acc;
      }, { DRAFT: [], REVIEW: [], PENDING: [], OPEN: [], CLOSED: [] }),
    [filteredByWs]
  );
  
  // --- ACTIONS ---

  // Manager approves a DRAFT ticket without changing severity
  const approveTicket = async (ticket) => {
    if (!token || !user) {
      toast({ title: "Authentication Error", description: "You must be logged in to perform this action.", variant: "destructive" });
      return;
    }
    
    // Check if the manager is trying to approve their own ticket
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

  // Manager reviews a ticket, potentially changing its severity
  const reviewTicket = async (ticket, newSeverity, reviewReason) => {
    if (!token || !user) {
      toast({ title: "Authentication Error", description: "You must be logged in to perform this action.", variant: "destructive" });
      return;
    }

    // Check if the manager is trying to review their own ticket
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

  // Associate updates a ticket that is in "REVIEW" status
  const updateTicketDetails = async (ticket, newTitle, newDescription) => {
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

      if (!res.ok) {
        throw new Error(`Failed to update ticket: ${res.status}`);
      }

      const json = await res.json();
      toast({ title: "Update Successful", description: json.message });
      const updatedTickets = await fetchTicketsFromApi(activeWorkspaceId, token);
      setTickets(updatedTickets);
      
    } catch (error) {
      console.error("Update failed:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({ title: "Update Failed", description: `Could not update ticket: ${errorMessage}`, variant: "destructive" });
    } finally {
      setIsActionLoading(false);
    }
  };

  // This function renders the correct button based on the ticket's status and user's role
  const renderActionButton = (ticket) => {
    // If the user object is not yet loaded, or the user's role isn't defined,
    // we can't determine the correct action, so we return "No Action".
    if (!user || !globalRole) {
      return <span className="text-gray-500">No Action</span>;
    }
    
    // Check if the current user created this ticket
    const isTicketCreator = user.uuid === ticket.createdBy;

    // Manager Actions
    if (globalRole === "MANAGER" && ticket.status === "DRAFT") {
      // A Manager cannot approve or review their own tickets
      if (isTicketCreator) {
        return <span className="text-gray-500">No Action</span>;
      }
      
      return (
        <div className="space-x-2">
          {/* Approve without changes, moves to PENDING */}
          <Button size="sm" variant="outline" onClick={() => approveTicket(ticket)} disabled={isActionLoading}>
            Approve
          </Button>
          {/* Review with a severity change, moves to REVIEW */}
          <Button size="sm" variant="secondary" onClick={() => reviewTicket(ticket, "HIGH", "Manager review: Severity increased.")} disabled={isActionLoading}>
            Review
          </Button>
        </div>
      );
    } 
    // Associate Actions
    else if (globalRole === "ASSOCIATE" && ticket.status === "REVIEW") { 
      // An Associate can only update the details of a ticket they created
      // if it has been moved to REVIEW status by a manager.
      if (isTicketCreator) {
        return (
          <Button size="sm" variant="secondary" onClick={() => updateTicketDetails(ticket, "Updated title", "Updated description.")} disabled={isActionLoading}>
            Update Details
          </Button>
        );
      }
      // An Associate cannot update a ticket created by someone else
      return <span className="text-gray-500">No Action</span>;
    } else {
      return (
        <span className="text-gray-500">No Action</span>
      );
    }
  };

  // If user or globalRole is not yet loaded, display a loading state.
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