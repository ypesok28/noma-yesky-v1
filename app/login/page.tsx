import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-6 lg:p-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-blue-100">
        <LoginForm />
      </div>
    </div>
  );
}
