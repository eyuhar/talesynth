"use client";

import { login, signup } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useTransition } from "react";

export default function AuthPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string>("");

  async function handleSubmit(e: React.FormEvent<HTMLButtonElement>) {
    e.preventDefault();
    setError(null);

    // For signup, ensure passwords match
    if (isSignup && password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    startTransition(async () => {
      // Call the appropriate Server Action
      const result = isSignup ? await signup(formData) : await login(formData);

      // If there's an error, show it (redirect happens in Server Action)
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex items-center justify-center w-full mt-[10%] p-2">
      {isSignup ? (
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Register a new account</CardTitle>
            <CardDescription>
              Enter a username, your email and password below to register a new
              account
              {message && (
                <p className="text-red-500 mt-2">{message}. Try again.</p>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  disabled={isPending}
                  onClick={(e) => handleSubmit(e)}
                  className="w-full cursor-pointer"
                >
                  {isPending ? "Registering..." : "Register"}
                </Button>
              </div>
            </div>
            <div className="flex mt-4 text-center text-sm justify-center gap-1">
              Already have an account?{" "}
              <p
                className="text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
                onClick={() => setIsSignup(!isSignup)}
              >
                Log in
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Log in to your account</CardTitle>
            <CardDescription>
              Enter your email and password below to log in to your account
              {error && (
                <p className="text-red-500 mt-2">Login failed. Try again.</p>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href=""
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  disabled={isPending}
                  onClick={(e) => handleSubmit(e)}
                  className="w-full cursor-pointer"
                >
                  {isPending ? "Logging in..." : "Login"}
                </Button>
              </div>
            </div>
            <div className="flex mt-4 text-center text-sm justify-center gap-1">
              Don&apos;t have an account?{" "}
              <p
                className="text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
                onClick={() => setIsSignup(!isSignup)}
              >
                Sign up
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
