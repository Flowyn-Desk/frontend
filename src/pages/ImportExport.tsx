import { useEffect, useRef, useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppState } from "@/context/AppState";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

export default function ImportExport() {
  const { toast } = useToast();
  const { activeWorkspaceId, backendUrl } = useAppState();
  const { token } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isAutoProcessing, setIsAutoProcessing] = useState(false);

  useEffect(() => {
    document.title = "Import/Export | Service Ticket System";
  }, []);

  async function exportCSV() {
    if (!activeWorkspaceId || !token) {
      toast({ title: "No workspace selected", description: "Please ensure a workspace is selected and you are authenticated.", variant: "destructive" });
      return;
    }

    setIsExporting(true);
    try {
      const url = `${backendUrl}/ticket/export-pending/${activeWorkspaceId}`;
      console.log("Export URL:", url);
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to export tickets: ${res.status}`);
      }

      const json = await res.json();
      const csvContent = json.data;

      if (!csvContent) {
        toast({ title: "No pending tickets", description: "There are no pending tickets to export." });
        return;
      }

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `pending_tickets_${activeWorkspaceId}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "Export Successful", description: "Pending tickets have been exported." });
      }
    } catch (error) {
      console.error("Export failed:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({ title: "Export Failed", description: `Could not export tickets: ${errorMessage}`, variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  }

  function importCSV() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast({ title: "No file selected", description: "Please choose a CSV file to import." });
      return;
    }

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csvContent = e.target?.result as string;

        const res = await fetch(`${backendUrl}/ticket/import-statuses`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ csvContent })
        });

        if (!res.ok) {
          throw new Error(`Failed to import statuses: ${res.status}`);
        }

        const json = await res.json();
        toast({ title: "Import Successful", description: json.message });
      } catch (error) {
        console.error("Import failed:", error);
        toast({ title: "Import Failed", description: "Could not import ticket statuses. Please try again.", variant: "destructive" });
      } finally {
        setIsImporting(false);
        if (fileRef.current) {
            fileRef.current.value = "";
        }
      }
    };
    reader.readAsText(file);
  }

  async function autoProcess() {
    const automationUrl = "https://ticket-csv-automation-897035279808.europe-west1.run.app/run-automation";

    if (!token) {
      toast({ title: "Authentication Error", description: "You must be authenticated to run this process.", variant: "destructive" });
      return;
    }

    setIsAutoProcessing(true);

    try {
      const res = await fetch(automationUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to trigger automation: ${res.status}`);
      }

      const json = await res.json();
      toast({ title: "Automation Triggered", description: json.message || "The automation process has started successfully." });
    } catch (error) {
      console.error("Automation failed:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({ title: "Automation Failed", description: `Could not trigger automation: ${errorMessage}`, variant: "destructive" });
    } finally {
      setIsAutoProcessing(false);
    }
  }

  return (
    <Layout title="Import/Export | Service Ticket System" description="Export Pending tickets and import updates by workspace.">
      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>CSV Export</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">Exports all Pending tickets for the active workspace.</p>
            <Button onClick={exportCSV} disabled={isExporting || !activeWorkspaceId || !token}>
              {isExporting ? "Exporting..." : "Export Pending"}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>CSV Import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <input ref={fileRef} type="file" accept=".csv" className="block" />
            <Button onClick={importCSV} disabled={isImporting || !activeWorkspaceId || !token}>
              {isImporting ? "Importing..." : "Import"}
            </Button>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Automation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">Manual trigger</p>
            <Button variant="secondary" onClick={autoProcess} disabled={isAutoProcessing || !token}>
              {isAutoProcessing ? "Running..." : "Run Now"}
            </Button>
          </CardContent>
        </Card>
      </section>
    </Layout>
  );
}
