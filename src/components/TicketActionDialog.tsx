import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppState } from "@/context/AppState";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function TicketActionDialog({ ticketData, isOpen, onClose }) {
  const { toast } = useToast();
  const { backendUrl } = useAppState();
  const { token } = useAuth();

  const [newSeverity, setNewSeverity] = useState(ticketData?.severity || "MEDIUM");
  const [reviewReason, setReviewReason] = useState("");
  const [newTitle, setNewTitle] = useState(ticketData?.title || "");
  const [newDescription, setNewDescription] = useState(ticketData?.description || "");

  const [isReviewing, setIsReviewing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (ticketData) {
      setNewSeverity(ticketData.severity);
      setNewTitle(ticketData.title);
      setNewDescription(ticketData.description);
    }
  }, [ticketData]);

  async function reviewTicket() {

    if (!token) {
      toast({ title: "Authentication Error", description: "You must be logged in to perform this action.", variant: "destructive" });
      return;
    }
    
    if (!ticketData?.uuid) {
      toast({ title: "Error", description: "No ticket selected for review.", variant: "destructive" });
      return;
    }

    setIsReviewing(true);
    try {
      const payload = {
        ticketUuid: ticketData.uuid,
        managerUuid: "sample-manager-uuid",
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
      
      onClose();

    } catch (error) {
      console.error("Review failed:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({ title: "Review Failed", description: `Could not review ticket: ${errorMessage}`, variant: "destructive" });
    } finally {
      setIsReviewing(false);
    }
  }

  async function updateTicketDetails() {

    if (!token) {
      toast({ title: "Authentication Error", description: "You must be logged in to perform this action.", variant: "destructive" });
      return;
    }

    if (!ticketData?.uuid) {
      toast({ title: "Error", description: "No ticket selected for update.", variant: "destructive" });
      return;
    }

    setIsUpdating(true);
    try {
      const payload = {
        ticketUuid: ticketData.uuid,
        associateUuid: "sample-associate-uuid",
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
        toast({ title: "Erro on update", description: json.message });
      }else{
        toast({ title: "Update Successful", description: json.message });
      }

      onClose();

    } catch (error) {
      console.error("Update failed:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({ title: "Update Failed", description: `Could not update ticket: ${errorMessage}`, variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Ticket Actions for {ticketData?.uuid}</DialogTitle>
        </DialogHeader>
        <section className="grid gap-6 md:grid-cols-2">
          {/* Manager Review Form */}
          <Card>
            <CardHeader>
              <CardTitle>Manager Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Reviewing ticket: <strong>{ticketData?.uuid}</strong>
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700">New Severity</label>
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="VERY_HIGH">Very High</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                  <option value="EASY">Easy</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Reason for Change</label>
                <Textarea
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  placeholder="Enter a reason for the severity change..."
                  className="mt-1"
                />
              </div>
              <Button onClick={reviewTicket} disabled={isReviewing || !token}>
                {isReviewing ? "Reviewing..." : "Review and Update"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Associate Update</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Updating ticket: <strong>{ticketData?.uuid}</strong>
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700">New Title</label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Enter new title"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">New Description</label>
                <Textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Enter new description"
                  className="mt-1"
                />
              </div>
              <Button onClick={updateTicketDetails} disabled={isUpdating || !token}>
                {isUpdating ? "Updating..." : "Update Details"}
              </Button>
            </CardContent>
          </Card>
        </section>
      </DialogContent>
    </Dialog>
  );
}
