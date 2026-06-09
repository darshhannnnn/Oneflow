"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import StaggeredMenu from "@/components/StaggeredMenu";
import ModelViewer from "@/components/ModelViewer";
import LaserFlow from "@/components/LaserFlow";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, Users, Calendar, BarChart3, DollarSign, Shield, Zap,
  Globe, Target, Sparkles, ClipboardList, Clock, TrendingUp
} from "lucide-react";

export default function Home() {
  const modelUrl = "/models/data_chart_graphic_table_infographic.glb";
  const [menuBtnColor, setMenuBtnColor] = useState('#000000');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [modelKey, setModelKey] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    // Set initial color
    const updateColor = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setMenuBtnColor(isDark ? '#ffffff' : '#000000');
      setIsDarkMode(isDark);
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

  // Force remount ModelViewer when returning to home page
  useEffect(() => {
    if (pathname === '/') {
      // Use timestamp to force complete remount after a small delay
      const timer = setTimeout(() => setModelKey(Date.now()), 0);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

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
              { label: "Features", link: "/#features", ariaLabel: "View Features" },
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

      {/* Hero */}
      <section id="hero" className="relative z-10">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-6 sm:gap-10 px-4 sm:px-6 pb-16 sm:pb-24 pt-20 sm:pt-28 md:grid-cols-2 md:gap-12 md:pb-28 md:pt-36 lg:gap-16">
          {/* Left: Copy */}
          <div className="order-2 flex flex-col items-start md:order-1">
            <span className="mb-3 sm:mb-4 inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/20 backdrop-blur-sm px-2.5 sm:px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 dark:bg-emerald-500/10">
              Plan to Bill in One Place
            </span>
            <h1 className="mb-3 sm:mb-4 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white lg:text-5xl xl:text-6xl">
              Manage Projects from
              <span className="ml-2 bg-linear-to-r from-emerald-500 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Planning to Billing
              </span>
            </h1>
            <p className="mb-6 sm:mb-8 max-w-xl text-base sm:text-lg leading-relaxed text-slate-700 dark:text-slate-300">
              Plan projects, execute tasks, log hours, and track financials—all in one place. From Sales Orders to Customer Invoices, manage your entire project lifecycle seamlessly.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <a
                href="/login"
                className="rounded-xl bg-emerald-500 px-5 sm:px-6 py-2.5 sm:py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all hover:bg-emerald-600 text-center backdrop-blur-sm"
              >
                Get Started
              </a>
              <a
                href="#features"
                className="rounded-xl border border-slate-300 bg-white/80 backdrop-blur-sm px-5 sm:px-6 py-2.5 sm:py-3 text-sm font-semibold text-slate-900 transition-all hover:bg-white hover:shadow-md dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:bg-slate-900 text-center"
              >
                Explore Features
              </a>
            </div>
          </div>

          {/* Right: 3D Model */}
          <div className="order-1 md:order-2 w-full relative">
            {/* Floating Capsule 1 - Top Right */}
            <div className="absolute -top-4 -right-4 sm:top-8 sm:right-8 z-20 animate-float">
              <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-500/90 to-teal-500/90 backdrop-blur-md rounded-full px-4 py-3 shadow-xl border border-emerald-400/30">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-white font-semibold text-sm ivy-font">Tasks Done</p>
                  <p className="text-white/80 text-xs ivy-font">12/15</p>
                </div>
              </div>
            </div>

            {/* Floating Capsule 2 - Bottom Left */}
            <div className="absolute -bottom-4 -left-4 sm:bottom-12 sm:left-4 z-20 animate-float-delayed">
              <div className="flex items-center gap-3 bg-gradient-to-r from-blue-500/90 to-cyan-500/90 backdrop-blur-md rounded-full px-4 py-3 shadow-xl border border-blue-400/30">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-white font-semibold text-sm ivy-font">Revenue</p>
                  <p className="text-white/80 text-xs ivy-font">₹1.2L</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-2 sm:p-3 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
              <div className="w-full aspect-square max-w-[570px] mx-auto">
                <ModelViewer
                  key={modelKey}
                  url={modelUrl}
                  defaultRotationX={10}
                  minZoomDistance={1.5}
                  maxZoomDistance={4.5}
                  enableManualZoom={true}
                  environmentPreset="city"
                  enableMouseParallax={true}
                  showScreenshotButton={false}
                  enableManualRotation={true}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section with LaserFlow */}
      <section id="features" className="relative z-10 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16">
            <Badge className="mb-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20">
              Complete Project Management
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Everything for Project Success
              <span className="block mt-2 bg-linear-to-r from-emerald-500 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                From Planning to Profit
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Manage projects, tasks, timesheets, and finances—track revenue, costs, and profit per project in real-time
            </p>
          </div>

          {/* LaserFlow Background Feature */}
          <div className="relative rounded-3xl overflow-hidden border border-border/40 bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 backdrop-blur-sm mb-12 shadow-xl">
            <div className="absolute inset-0 z-0 opacity-80 dark:opacity-100">
              <LaserFlow
                className="w-full h-full"
                color={isDarkMode ? "#10b981" : "#059669"}
                wispDensity={1.2}
                flowSpeed={0.4}
                fogIntensity={isDarkMode ? 0.35 : 0.25}
                wispSpeed={12}
                verticalSizing={2.5}
                horizontalSizing={0.6}
              />
            </div>
            <div className="relative z-10 p-8 sm:p-12 lg:p-16">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30 mb-6">
                  <Sparkles className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Integrated Workflow</span>
                </div>
                <h3 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                  Plan, Execute, and Bill
                </h3>
                <p className="text-lg text-slate-700 dark:text-slate-200 mb-6">
                  Link Sales Orders, Purchase Orders, Customer Invoices, and Vendor Bills—see Revenue, Cost, and Profit per project in real-time.
                </p>
                <button className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg">
                  Explore Workflow
                </button>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-border/40 backdrop-blur-sm bg-card/50 cursor-pointer">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500 transition-colors">
                  <Target className="h-6 w-6 text-emerald-500 group-hover:text-white transition-colors" />
                </div>
                <CardTitle className="text-xl ivy-font">Project Planning</CardTitle>
                <CardDescription className="ivy-font">
                  Create projects, assign teams, set deadlines, and track progress with visual indicators
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 2 */}
            <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-border/40 backdrop-blur-sm bg-card/50 cursor-pointer">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors">
                  <ClipboardList className="h-6 w-6 text-blue-500 group-hover:text-white transition-colors" />
                </div>
                <CardTitle className="text-xl ivy-font">Task Management</CardTitle>
                <CardDescription className="ivy-font">
                  Assign tasks, track status (New → In Progress → Blocked → Done), and manage blockers
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 3 */}
            <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-border/40 backdrop-blur-sm bg-card/50 cursor-pointer">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-purple-500 transition-colors">
                  <Clock className="h-6 w-6 text-purple-500 group-hover:text-white transition-colors" />
                </div>
                <CardTitle className="text-xl ivy-font">Timesheet Tracking</CardTitle>
                <CardDescription className="ivy-font">
                  Log hours worked, mark as billable/non-billable, and calculate costs with hourly rates
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 4 */}
            <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-border/40 backdrop-blur-sm bg-card/50 cursor-pointer">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 group-hover:bg-amber-500 transition-colors">
                  <DollarSign className="h-6 w-6 text-amber-500 group-hover:text-white transition-colors" />
                </div>
                <CardTitle className="text-xl ivy-font">Financial Management</CardTitle>
                <CardDescription className="ivy-font">
                  Link Sales Orders, Purchase Orders, Invoices, and Bills—track Revenue, Cost & Profit
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 5 */}
            <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-border/40 backdrop-blur-sm bg-card/50 cursor-pointer">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4 group-hover:bg-red-500 transition-colors">
                  <Users className="h-6 w-6 text-red-500 group-hover:text-white transition-colors" />
                </div>
                <CardTitle className="text-xl ivy-font">Team Collaboration</CardTitle>
                <CardDescription className="ivy-font">
                  Role-based access for Project Managers, Team Members, Sales, Finance, and Admins
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 6 */}
            <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-border/40 backdrop-blur-sm bg-card/50 cursor-pointer">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center mb-4 group-hover:bg-teal-500 transition-colors">
                  <BarChart3 className="h-6 w-6 text-teal-500 group-hover:text-white transition-colors" />
                </div>
                <CardTitle className="text-xl ivy-font">Analytics & Reports</CardTitle>
                <CardDescription className="ivy-font">
                  Real-time dashboards for project progress, resource utilization, and profitability
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="mt-16 text-center">
            <div className="inline-flex flex-col sm:flex-row gap-4">
              <button className="px-8 py-4 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-all hover:scale-105 shadow-lg hover:shadow-xl">
                Start Free Trial
              </button>
              <button className="px-8 py-4 bg-transparent border-2 border-border text-foreground rounded-xl font-semibold hover:bg-muted transition-all hover:scale-105">
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}
