import { FormEvent, useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppState, Severity } from "@/context/AppState";
import { useToast } from "@/hooks/use-toast";

const severities: Severity[] = ["Very High", "High", "Medium", "Low", "Easy"];

export default function CreateTicket() {
  const { activeWorkspaceId, userId, createTicket } = useAppState();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [severity, setSeverity] = useState<Severity>("Medium");

  useEffect(() => {
    document.title = "Create Ticket | Service Ticket System";
  }, []);

  const aiSuggestion = useMemo(() => severity, [severity]);

  function suggestSeverity() {
    // Mock AI suggestion - always a valid enum value
    const pick = severities[Math.floor(Math.random() * severities.length)];
    setSeverity(pick);
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
    setSeverity("Medium");
    toast({ title: "Ticket created", description: `Saved with severity ${severity}.` });
  }

  // Example: send to your backend with JWT auto-attached
  // import { apiFetch } from "@/lib/api";
  // async function createTicketViaApi() {
  //   const res = await apiFetch("/tickets", {
  //     method: "POST",
  //     body: JSON.stringify({ title, description, dueDate: dueDate || undefined, severity, workspaceId: activeWorkspaceId })
  //   });
  //   if (!res.ok) throw new Error("Failed to create ticket");
  //   const json = await res.json();
  //   console.log("Created ticket:", json);
  // }

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
                  <Label>Severity (AI suggested)</Label>
                  <div className="flex items-center gap-2">
                    <Select value={severity} onValueChange={(v) => setSeverity(v as Severity)}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {severities.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="secondary" onClick={suggestSeverity}>
                      Get AI Suggestion
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Suggestion: {aiSuggestion}</p>
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