import AuthForm from "@/components/forms/AuthForm";

export default function Login() {
  return (
    <div className="flex items-center justify-center h-screen w-full">
      <AuthForm type="login" />
    </div>
  );
}
