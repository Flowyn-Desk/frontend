import { FormEvent, useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppState, Severity } from "@/context/AppState";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

const severities: Severity[] = ["VERY_HIGH", "HIGH", "MEDIUM", "LOW", "EASY"];

const displaySeverityName = (severity: Severity) => {
  switch (severity) {
    case "VERY_HIGH": return "Very High";
    case "HIGH": return "High";
    case "MEDIUM": return "Medium";
    case "LOW": return "Low";
    case "EASY": return "Easy";
    default: return severity;
  }
};


export default function CreateTicket() {
  const { activeWorkspaceId, userId, setTickets, backendUrl } = useAppState();
  const { toast } = useToast();
  const { token } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [severity, setSeverity] = useState<Severity>("MEDIUM");
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.title = "Create Ticket | Service Ticket System";
  }, []);

  async function getAiSuggestion(title: string, description: string): Promise<Severity | null> {
    setIsAiSuggesting(true);

    try {
      const res = await fetch(`${backendUrl}/ticket/suggest-severity`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ title, description })
      });

      if (!res.ok) {
        throw new Error(`Failed to get AI suggestion: ${res.status}`);
      }

      const json = await res.json();
      if (json?.data) {
        return json.data as Severity;
      }
      
      throw new Error("Invalid response from backend");

    } catch (error) {
      console.error("AI suggestion failed:", error);
      toast({ title: "AI Suggestion Failed", description: "Could not get an AI suggestion. Please select a severity manually.", variant: "destructive" });
      return null;
    } finally {
      setIsAiSuggesting(false);
    }
  }

  async function suggestSeverity() {
    const suggestedSeverity = await getAiSuggestion(title, description);
    if (suggestedSeverity) {
      setSeverity(suggestedSeverity);
      toast({ title: "AI Suggestion Received", description: `Severity suggested as ${displaySeverityName(suggestedSeverity)}.` });
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title || !description) {
      toast({ title: "Missing info", description: "Please provide a title and description." });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${backendUrl}/ticket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          workspaceUuid: activeWorkspaceId,
          createdByUuid: userId,
          title,
          description,
          severity,
          dueDate: dueDate || null,
          severityChangeReason: null,
        })
      });

      if (!res.ok) {
        throw new Error(`Failed to create ticket: ${res.status}`);
      }

      const json = await res.json();
      setTickets(prevTickets => [json.data, ...prevTickets]);
      
      setTitle("");
      setDescription("");
      setDueDate("");
      setSeverity("MEDIUM");
      toast({ title: `Ticket created ${json.data.ticketNumber}`, description: `Saved with severity ${displaySeverityName(json.data.severity)}.` });
    } catch (error) {
      console.error("Failed to create ticket:", error);
      toast({ title: "Error", description: "Failed to create ticket. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Layout title="Create Ticket | Service Ticket System" description="Create a new support ticket with AI-assisted severity.">
      <section className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>New Ticket</CardTitle>
          </CardHeader>
          <form onSubmit={onSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short summary" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the issue" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="due">Due date</Label>
                  <Input id="due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Severity</Label>
                  <div className="flex items-center gap-2">
                    <Select value={severity} onValueChange={(v) => setSeverity(v as Severity)}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {severities.map((s) => (
                          <SelectItem key={s} value={s}>
                            {displaySeverityName(s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="secondary" onClick={suggestSeverity} disabled={isAiSuggesting || !title || !description}>
                      {isAiSuggesting ? "Thinking..." : "Get AI Suggestion"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </section>
    </Layout>
  );
}
