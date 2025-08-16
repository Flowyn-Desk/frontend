import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/context/AppState";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface TicketHistoryItem {
  uuid: string;
  createdAt: string;
  previousStatus: string;
  newStatus: string;
  previousSeverity?: string | null;
  newSeverity?: string | null;
  changeReason?: string | null;
  userUuid: string;
  userEmail?: string;
}

interface DetailsPopupProps {
  ticketUuid: string;
}

const DetailsPopup = ({ ticketUuid }: DetailsPopupProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [history, setHistory] = useState<TicketHistoryItem[]>([]);
  const { backendUrl } = useAppState();
  const { token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isDialogOpen) {
      fetchTicketHistory();
    }
  }, [isDialogOpen]);

  const fetchTicketHistory = async () => {
    if (!token) return;

    try {
      const historyRes = await fetch(`${backendUrl}/ticket/history/${ticketUuid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!historyRes.ok) {
        throw new Error("Failed to fetch ticket history.");
      }

      const historyData = await historyRes.json();
      const rawHistory: TicketHistoryItem[] = historyData.data;

      // Fetch user emails for each history entry
      const historyWithUsers = await Promise.all(
        rawHistory.map(async (entry) => {
          const userRes = await fetch(`${backendUrl}/user/${entry.userUuid}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const userData = await userRes.json();
          return {
            ...entry,
            userEmail: userData?.data?.email || "Unknown User",
          };
        })
      );

      // Sort history by creation date, newest first
      const sortedHistory = historyWithUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setHistory(sortedHistory);
    } catch (error) {
      console.error("Failed to load ticket history:", error);
      toast({
        title: "Error",
        description: "Failed to load ticket history.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">Details</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ticket History</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {history.length > 0 ? (
            history.map((entry) => (
              <div key={entry.uuid} className="border-b pb-4 last:border-b-0">
                <p><strong>Date:</strong> {new Date(entry.createdAt).toLocaleString()}</p>
                <p><strong>Responsible User:</strong> {entry.userEmail}</p>
                <p><strong>Status Change:</strong> {entry.previousStatus} → {entry.newStatus}</p>
                {entry.previousSeverity && entry.newSeverity && (
                  <p><strong>Severity Change:</strong> {entry.previousSeverity} → {entry.newSeverity}</p>
                )}
                {entry.changeReason && (
                  <p><strong>Reason:</strong> {entry.changeReason}</p>
                )}
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground">No history available for this ticket.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DetailsPopup;