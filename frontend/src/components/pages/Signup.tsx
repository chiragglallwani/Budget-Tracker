import AuthForm from "@/components/forms/AuthForm";

export default function Signup() {
  return (
    <div className="flex items-center justify-center h-screen w-full">
      <AuthForm type="signup" />
    </div>
  );
}
