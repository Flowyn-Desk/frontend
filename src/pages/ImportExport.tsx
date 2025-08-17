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
  const { token, user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const simulateFileRef = useRef<HTMLInputElement>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isAutoProcessing, setIsAutoProcessing] = useState(false);
  const [isSimulatingExternalSupport, setIsSimulatingExternalSupport] = useState(false);

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
          body: JSON.stringify({ "csvContent": csvContent, managerUuid: user.uuid })
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
        method: "POST"
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

  async function simulateExternalSupport() {
    const file = simulateFileRef.current?.files?.[0];
    if (!file) {
      toast({ title: "No file selected", description: "Please choose a CSV file to simulate." });
      return;
    }

    setIsSimulatingExternalSupport(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csvContent = e.target?.result as string;
        toast({ title: "Processing...", description: "Sending CSV for external support simulation." });

        const url = `https://ticket-csv-automation-897035279808.europe-west1.run.app/simulate-external-support`;

        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ "csvContent": csvContent })
        });

        if (!res.ok) {
          throw new Error(`Failed to simulate external support: ${res.status}`);
        }

        const json = await res.json();
        const newCsvContent = json.data;
        const message = json.message;

        if (!newCsvContent) {
          toast({ title: "No return data", description: message || "External support did not return any processed tickets." });
          return;
        }

        const blob = new Blob([newCsvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        if (link.download !== undefined) {
          const downloadUrl = URL.createObjectURL(blob);
          const uniqueId = new Date().getTime();
          link.setAttribute("href", downloadUrl);
          link.setAttribute("download", `interactionresult_${activeWorkspaceId}_${uniqueId}.csv`);
          link.style.visibility = "hidden";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast({ title: "Simulation Complete", description: message || "Processed tickets have been downloaded." });
        }

      } catch (error) {
        console.error("Simulation failed:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({ title: "Simulation Failed", description: `Could not run external support simulation: ${errorMessage}`, variant: "destructive" });
      } finally {
        setIsSimulatingExternalSupport(false);
        if (simulateFileRef.current) {
          simulateFileRef.current.value = "";
        }
      }
    };
    reader.readAsText(file);
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
            <p className="text-sm text-muted-foreground">
              This trigger provides a manual override to execute the full external support simulation workflow. The daily scheduled process is currently disabled for consistent testing.
            </p>
            <Button variant="secondary" onClick={autoProcess} disabled={isAutoProcessing || !token}>
              {isAutoProcessing ? "Running..." : "Run Now"}
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>External Support Simulation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Simulate the end-to-end workflow of a third-party support team processing tickets. Follow the steps below to run the simulation.
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Manually export the pending tickets as a CSV file.</li>
              <li>Select the previously exported CSV file using the file input below.</li>
              <li>Click the "Run Now" button to execute the simulation.</li>
              <li>A new CSV file will be generated with the simulated updated status of the tickets.</li>
              <li>Import the new CSV file back into your system to update the tickets.</li>
            </ol>
            <input ref={simulateFileRef} type="file" accept=".csv" className="block" />
            <Button variant="secondary" onClick={simulateExternalSupport} disabled={isSimulatingExternalSupport}>
              {isSimulatingExternalSupport ? "Running..." : "Run Now"}
            </Button>
          </CardContent>
        </Card>

      </section>
    </Layout>
  );
}
