import { redirectIfAuthenticated } from "@/lib/proxy";
import LoginForm from "./login-form";

export default async function LoginPage() {
  await redirectIfAuthenticated();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <LoginForm />
    </div>
  );
}
