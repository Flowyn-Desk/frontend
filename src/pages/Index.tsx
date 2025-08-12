import { Link } from "react-router-dom";
import Layout from "@/components/Layout";

const Index = () => {
  return (
    <Layout title="Service Ticket System" description="Create, review, and track service tickets by workspace.">
      <section className="max-w-2xl mx-auto text-center space-y-4">
        <h1 className="text-3xl font-bold">Service Ticket Management</h1>
        <p className="text-muted-foreground">Clean, basic UI. Workspaces, roles, and CSV flow are supported in this interface.</p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/tickets" className="underline">View Tickets</Link>
          <span className="text-muted-foreground">/</span>
          <Link to="/create" className="underline">Create Ticket</Link>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
