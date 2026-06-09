"use client";

import { useState, useEffect } from "react";
import StaggeredMenu from "@/components/StaggeredMenu";
import RoleBasedNav from "@/components/RoleBasedNav";

export default function DashboardLayout({ children }) {
  const [menuBtnColor, setMenuBtnColor] = useState('#000000');

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

  return (
    <>
      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
        {/* Centered Role-Based Navigation Pills */}
        <div className="absolute top-0 left-0 right-0 flex justify-center items-center pt-6 pointer-events-none">
          <div className="pointer-events-auto">
            <RoleBasedNav />
          </div>
        </div>

        {/* StaggeredMenu (Logo, Theme Toggle, Menu Button) */}
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
              { label: "Projects", link: "/dashboard/projects", ariaLabel: "View Projects" },
              { label: "Assistant", link: "/assistant", ariaLabel: "AI Assistant" },
              { label: "Features", link: "/#features", ariaLabel: "View Features" },
            ]}
            socialItems={[
              { label: "LinkedIn", link: "https://linkedin.com" },
              { label: "Twitter", link: "https://x.com" },
              { label: "GitHub", link: "https://github.com" },
            ]}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="pt-24">
        {children}
      </main>
    </>
  );
}
