import { useEffect, useMemo } from "react";
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
  const { tickets, activeWorkspaceId, globalRole, updateTicketStatus, setTickets, backendUrl } = useAppState();
  const { toast } = useToast();
  const { token } = useAuth();
  
  useEffect(() => {
    document.title = "Tickets by status | Service Tickets";
  
    async function fetchTicketsFromApi(workspaceId, authToken) {
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
    }
  
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
  }, [activeWorkspaceId, token, toast, setTickets]);
  

  const filteredByWs = useMemo(() => tickets.filter((t) => t.workspaceId === activeWorkspaceId), [tickets, activeWorkspaceId]);

  const grouped = useMemo(
    () =>
      statusOrder.reduce((acc, s) => {
        acc[s] = filteredByWs.filter((t) => t.status === s);
        return acc;
      }, { DRAFT: [], REVIEW: [], PENDING: [], OPEN: [], CLOSED: [] }), // Initial object keys now also match
    [filteredByWs]
  );

  // Corrected check to match backend enum
  const canReview = globalRole === "MANAGER";

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
                            {s === "DRAFT" && canReview && (
                              <Button size="sm" variant="secondary" onClick={() => {
                                updateTicketStatus(t.id, "PENDING");
                                toast({ title: "Approved", description: `${t.number} moved to Pending` });
                              }}>
                                Approve
                              </Button>
                            )}
                            {s === "PENDING" && (
                              <Button size="sm" variant="outline" onClick={() => toast({ title: "Export", description: "Use Import/Export page to export CSV." })}>
                                Export CSV
                              </Button>
                            )}
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
