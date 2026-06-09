"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { signupSchema, loginSchema } from "@/lib/validations";
import StaggeredMenu from "@/components/StaggeredMenu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Mail, Lock, Eye, EyeOff, Sparkles, TrendingUp, 
  Shield, Chrome, AlertCircle, Loader2, UserCircle
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [menuBtnColor, setMenuBtnColor] = useState('#000000');
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    role: "TEAM_MEMBER" // Default role
  });

  useEffect(() => {
    // Set initial color
    const updateColor = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setMenuBtnColor(isDark ? '#ffffff' : '#000000');
    };
    
    updateColor();
    
    // Watch for theme changes
    const observer = new MutationObserver(updateColor);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setIsLoading(true);

    try {
      // Validate form data with Zod
      const schema = isLogin ? loginSchema : signupSchema;
      const validation = schema.safeParse(formData);

      if (!validation.success) {
        const errors = {};
        const errorMessages = [];
        
        // Zod uses 'issues' not 'errors'
        validation.error.issues.forEach((err) => {
          const field = String(err.path[0] || 'unknown');
          const message = err.message;
          errors[field] = message;
          // Create a user-friendly field name
          const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
          errorMessages.push(`• ${fieldName}: ${message}`);
        });
        
        setFieldErrors(errors);
        
        // Set error with detailed list
        if (errorMessages.length > 0) {
          setError(errorMessages.join('\n'));
        } else {
          setError('Please fix the validation errors below');
        }
        setIsLoading(false);
        return;
      }

      if (isLogin) {
        // Login with credentials
        const result = await signIn("credentials", {
          redirect: false,
          email: formData.email,
          password: formData.password,
        });

        if (result?.error) {
          setError(result.error || "Invalid email or password");
          setIsLoading(false);
        } else if (result?.ok) {
          // Redirect to dashboard on success
          router.push("/dashboard");
          router.refresh();
        } else {
          setError("Login failed. Please try again.");
          setIsLoading(false);
        }
      } else {
        // Sign up
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            name: formData.name,
            role: formData.role,
          }),
        });

        if (!response.ok) {
          let errorMessage = "Failed to create account";
          try {
            const data = await response.json();
            errorMessage = data.error || errorMessage;
          } catch (e) {
            // Response is not JSON
            errorMessage = `Server error: ${response.status}`;
          }
          setError(errorMessage);
          setIsLoading(false);
          return;
        }

        const data = await response.json();

        // Auto login after signup
        const result = await signIn("credentials", {
          redirect: false,
          email: formData.email,
          password: formData.password,
        });

        if (result?.error) {
          setError("Account created but login failed. Please try logging in manually.");
          setIsLoading(false);
        } else if (result?.ok) {
          router.push("/dashboard");
          router.refresh();
        } else {
          setError("Account created but login failed. Please try logging in.");
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      setError("An unexpected error occurred. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");
    try {
      // For OAuth, NextAuth will automatically redirect:
      // - New users (no role) -> /auth/role-setup (via pages.newUser)
      // - Existing users (with role) -> /dashboard (default callback)
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (error) {
      console.error("Google sign in error:", error);
      setError("Failed to sign in with Google");
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: undefined
      });
    }
  };

  return (
    <main className="relative min-h-screen w-full">
      {/* Navbar */}
      <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
        <div className="pointer-events-auto">
          <StaggeredMenu
            position="right"
            isFixed={true}
            logoUrl="/favicon.ico"
            accentColor="#22c55e"
            colors={["#0f172a", "#111827", "#1f2937"]}
            menuButtonColor={menuBtnColor}
            openMenuButtonColor="#22c55e"
            items={[
              { label: "Home", link: "/", ariaLabel: "Go to Home" },
              { label: "Dashboard", link: "/dashboard", ariaLabel: "View Dashboard" },
              { label: "Assistant", link: "/assistant", ariaLabel: "AI Assistant" },
              { label: "Features", link: "/#features", ariaLabel: "View Features" },
              { label: "Pricing", link: "/#pricing", ariaLabel: "View Pricing" },
              { label: "Contact", link: "/#contact", ariaLabel: "Contact us" },
              { label: "Login", link: "/login", ariaLabel: "Login to your account" },
            ]}
            socialItems={[
              { label: "LinkedIn", link: "https://linkedin.com" },
              { label: "Twitter", link: "https://x.com" },
              { label: "GitHub", link: "https://github.com" },
            ]}
          />
        </div>
      </div>

      <div className="min-h-screen w-full flex items-center justify-center p-4 pt-24 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
        </div>

      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left Side - Branding */}
        <div className="hidden md:block space-y-6">
          <div className="space-y-4">
            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20">
              Project Management Platform
            </Badge>
            <h1 className="text-5xl font-bold text-foreground ivy-font">
              Welcome to
              <span className="block mt-2 bg-linear-to-r from-emerald-500 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                OneFlow
              </span>
            </h1>
            <p className="text-lg text-muted-foreground ivy-font max-w-md">
              Streamline your projects, track tasks, and collaborate with your team in one unified platform.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="space-y-3 mt-8">
            {[
              { icon: TrendingUp, title: "Project Analytics", desc: "Track progress and performance metrics" },
              { icon: Shield, title: "Secure & Reliable", desc: "Your data is encrypted and protected" },
              { icon: Sparkles, title: "Smart Task Management", desc: "Kanban boards and workflow automation" }
            ].map((feature, idx) => (
              <div 
                key={idx}
                className="flex items-start gap-4 p-4 rounded-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/60 dark:border-slate-800"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <feature.icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground ivy-font">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground ivy-font">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Form */}
        <Card className="border-border/40 backdrop-blur-xl bg-card/80 shadow-2xl">
          <CardHeader className="space-y-1 text-center pb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-lg bg-linear-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl ivy-font">
              {isLogin ? "Welcome back" : "Create account"}
            </CardTitle>
            <CardDescription className="ivy-font">
              {isLogin 
                ? "Enter your credentials to access your account" 
                : "Sign up to start managing your projects"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-600 dark:text-red-400 ivy-font whitespace-pre-line">
                    {error}
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name field - only for signup */}
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="ivy-font">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleChange}
                      required={!isLogin}
                      className={`ivy-font ${fieldErrors.name ? 'border-red-500' : ''}`}
                    />
                    {fieldErrors.name && (
                      <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.name}</p>
                    )}
                  </div>

                  {/* Role Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="role" className="ivy-font">Role</Label>
                    <div className="relative">
                      <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        required={!isLogin}
                        className={`flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ivy-font ${fieldErrors.role ? 'border-red-500' : ''}`}
                      >
                        <option value="TEAM_MEMBER">Team Member</option>
                        <option value="PROJECT_MANAGER">Project Manager</option>
                        <option value="SALES">Sales</option>
                        <option value="FINANCE">Finance</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                    {fieldErrors.role && (
                      <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.role}</p>
                    )}
                    <p className="text-xs text-muted-foreground ivy-font">
                      Select your role in the organization
                    </p>
                  </div>
                </>
              )}

              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="ivy-font">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={`pl-10 ivy-font ${fieldErrors.email ? 'border-red-500' : ''}`}
                    required
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.email}</p>
                )}
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="ivy-font">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className={`pl-10 pr-10 ivy-font ${fieldErrors.password ? 'border-red-500' : ''}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.password}</p>
                )}
              </div>

              {/* Confirm Password - only for signup */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="ivy-font">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`pl-10 ivy-font ${fieldErrors.confirmPassword ? 'border-red-500' : ''}`}
                      required={!isLogin}
                    />
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.confirmPassword}</p>
                  )}
                </div>
              )}

              {/* Forgot Password - only for login */}
              {isLogin && (
                <div className="flex justify-end">
                  <Link 
                    href="/forgot-password" 
                    className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 ivy-font"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white ivy-font"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isLogin ? "Signing in..." : "Creating account..."}
                  </>
                ) : (
                  isLogin ? "Sign In" : "Create Account"
                )}
              </Button>

              {/* Divider */}
              <div className="relative my-6">
                <Separator />
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground ivy-font">
                  Or continue with
                </span>
              </div>

              {/* Social Login */}
              <div className="grid grid-cols-1 gap-3">
                <Button 
                  type="button" 
                  variant="outline"
                  className="ivy-font w-full"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Chrome className="w-4 h-4 mr-2" />
                  )}
                  Google
                </Button>
              </div>

              {/* Toggle Login/Signup */}
              <p className="text-center text-sm text-muted-foreground ivy-font mt-6">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError("");
                    setFieldErrors({});
                    setFormData({
                      email: "",
                      password: "",
                      confirmPassword: "",
                      name: "",
                      role: "TEAM_MEMBER"
                    });
                  }}
                  className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium"
                  disabled={isLoading}
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </p>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
    </main>
  );
}
