import { useEffect, useMemo } from "react";
import Layout from "@/components/Layout";
import { useAppState, Status } from "@/context/AppState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const statusOrder: Status[] = ["Draft", "Review", "Pending", "Open", "Closed"];

export default function Tickets() {
  const { tickets, activeWorkspaceId, globalRole, updateTicketStatus,  } = useAppState();
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Tickets by status | Service Tickets";
  
    async function loadTickets() {
      try {
        const data = await fetchTicketsFromApi(activeWorkspaceId);
        setTickets(data);
      } catch (err) {
        toast({ title: "Error", description: "Failed to load tickets." });
        console.error(err);
      }
    }
  
    loadTickets();
  }, [activeWorkspaceId]);
  

  const filteredByWs = useMemo(() => tickets.filter((t) => t.workspaceId === activeWorkspaceId), [tickets, activeWorkspaceId]);

  const grouped = useMemo(
    () =>
      statusOrder.reduce<Record<Status, typeof filteredByWs>>((acc, s) => {
        acc[s] = filteredByWs.filter((t) => t.status === s);
        return acc;
      }, { Draft: [], Review: [], Pending: [], Open: [], Closed: [] }),
    [filteredByWs]
  );

  const canReview = globalRole === "manager";

  return (
    <Layout title="Tickets | Service Ticket System" description="Browse and manage tickets by status across workspaces.">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Tickets</h1>
          <Button asChild>
            <Link to="/create">Create Ticket</Link>
          </Button>
        </div>
        <Tabs defaultValue="Draft">
          <TabsList className="grid grid-cols-5 w-full">
            {statusOrder.map((s) => (
              <TabsTrigger key={s} value={s}>
                {s} ({grouped[s].length})
              </TabsTrigger>
            ))}
          </TabsList>

          {statusOrder.map((s) => (
            <TabsContent key={s} value={s}>
              <Card>
                <CardHeader>
                  <CardTitle>{s} Tickets</CardTitle>
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
                            {s === "Draft" && canReview && (
                              <Button size="sm" variant="secondary" onClick={() => {
                                updateTicketStatus(t.id, "Pending");
                                toast({ title: "Approved", description: `${t.number} moved to Pending` });
                              }}>
                                Approve
                              </Button>
                            )}
                            {s === "Pending" && (
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
                            No tickets in {s}.
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
