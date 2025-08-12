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

// Use the correct uppercase string values from the backend
const severities: Severity[] = ["VERY_HIGH", "HIGH", "MEDIUM", "LOW", "EASY"];

// Helper function to map backend status to display text
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
  const { activeWorkspaceId, userId, createTicket } = useAppState();
  const { toast } = useToast();
  const { token } = useAuth(); // Get the auth token

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [severity, setSeverity] = useState<Severity>("MEDIUM"); // Default to MEDIUM
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);

  useEffect(() => {
    document.title = "Create Ticket | Service Ticket System";
  }, []);

  // Async function to get an AI suggestion for severity from the backend
  async function getAiSuggestion(title: string, description: string): Promise<Severity | null> {
    setIsAiSuggesting(true);

    try {
      const res = await fetch(`http://localhost:3000/ticket/suggest-severity`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // Include the auth token
        },
        body: JSON.stringify({ title, description })
      });

      if (!res.ok) {
        throw new Error(`Failed to get AI suggestion: ${res.status}`);
      }

      const json = await res.json();
      // Correctly access the severity value directly from the 'data' field
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

  // Refactored function to call the AI and update the state
  async function suggestSeverity() {
    const suggestedSeverity = await getAiSuggestion(title, description);
    if (suggestedSeverity) {
      setSeverity(suggestedSeverity);
      toast({ title: "AI Suggestion Received", description: `Severity suggested as ${displaySeverityName(suggestedSeverity)}.` });
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title || !description) {
      toast({ title: "Missing info", description: "Please provide a title and description." });
      return;
    }
    createTicket({ title, description, dueDate: dueDate || undefined, severity, workspaceId: activeWorkspaceId, createdBy: userId });
    setTitle("");
    setDescription("");
    setDueDate("");
    setSeverity("MEDIUM");
    toast({ title: "Ticket created", description: `Saved with severity ${displaySeverityName(severity)}.` });
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
              <Button type="submit">Create</Button>
            </CardFooter>
          </form>
        </Card>
      </section>
    </Layout>
  );
}
