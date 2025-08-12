import { useForm } from "react-hook-form";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

type FormValues = {
  email: string;
  password: string;
};

export default function Login() {
  const { register, handleSubmit, formState } = useForm<FormValues>({
    defaultValues: { email: "john@user.com", password: "" },
  });
  const { toast } = useToast();
  const { login } = useAuth();

  const onSubmit = async (values: FormValues) => {
    try {
      await login(values.email, values.password);
      toast({ title: "Logged in", description: "Redirecting to tickets..." });
    } catch (e: any) {
      toast({
        title: "Login failed",
        description: e?.message || "Check your credentials and try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout title="Login - Ticket Manager" description="Sign in to access your tickets.">
      <section className="mx-auto max-w-md">
        <h1 className="text-2xl font-semibold mb-4">Login</h1>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register("email", { required: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" {...register("password", { required: true })} />
          </div>
          <Button type="submit" disabled={formState.isSubmitting} className="w-full">
            {formState.isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <aside className="mt-4 text-sm text-muted-foreground">
          Use your backend: POST http://localhost:3000/user/authenticate
        </aside>
      </section>
    </Layout>
  );
}