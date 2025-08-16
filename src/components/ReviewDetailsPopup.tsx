import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GlobalRole } from "@/context/AppState";

interface Ticket {
  id: string;
  number: number;
  title: string;
  description: string;
  severity: string;
  createdBy: string;
}

const severities = ["Very High", "High", "Medium", "Low", "Easy"];

interface ReviewDetailsPopupProps {
  ticket: Ticket;
  onSave: (
    ticket: Ticket, 
    ...args: (string | number)[] 
  ) => Promise<void>;
  globalRole: GlobalRole;
  isTicketCreator: boolean;
}

export const ReviewDetailsPopup = ({ ticket, onSave, globalRole }: ReviewDetailsPopupProps) => {
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