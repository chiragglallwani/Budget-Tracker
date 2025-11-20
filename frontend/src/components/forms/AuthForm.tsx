import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthSchema, type AuthSchemaType } from "@/types/Schema";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Link, useNavigate } from "react-router-dom";
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
type AuthFormProps = {
  type: "login" | "signup";
};
export default function AuthForm({ type }: AuthFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { login, register, isLoading, message } = useAuth();
  const navigate = useNavigate();
  const form = useForm<AuthSchemaType>({
    resolver: zodResolver(AuthSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: AuthSchemaType) {
    let response = false;
    if (type === "login") {
      response = await login(values.email, values.password);
    } else {
      response = await register(values.email, values.password);
    }
    if (response) navigate("/");
  }
  return (
    <Card className="w-full sm:max-w-md text-center">
      <CardHeader>
        <CardTitle>{type === "login" ? "Login" : "Register"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            className="space-y-8 text-left"
            onSubmit={form.handleSubmit(onSubmit)}
            autoComplete="off"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Email" type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Password"
                        className="pr-1"
                        type={showPassword ? "text" : "password"}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-none rounded-none absolute right-2 top-1/2 -translate-y-1/2 bg-transparent shadow-none hover:bg-transparent hover:shadow-none"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeIcon className="h-4 w-4" />
                      ) : (
                        <EyeOffIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
              >
                Reset
              </Button>
              <Button variant="theme" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : type === "login" ? (
                  "Login"
                ) : (
                  "Register"
                )}
              </Button>
            </div>
          </form>
        </Form>
        {message && <p className="text-sm text-destructive">{message}</p>}
      </CardContent>
      <CardFooter className="flex items-center justify-center">
        <Link
          className="text-sm text-muted-foreground hover:underline hover:underline-offset-2"
          to={type === "login" ? "/signup" : "/login"}
        >
          {type === "login"
            ? "Don't have an account? Signup"
            : "Already have an account? Login"}
        </Link>
      </CardFooter>
    </Card>
  );
}
