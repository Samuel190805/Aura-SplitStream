"use client";

import React from "react";
import { GlassNav } from "./GlassNav";
import { Footer } from "./Footer";
import { GlobalAudioProvider } from "@/components/audio/GlobalAudioPlayer";
import { ToastContainer } from "@/components/ui/Toast";

export const AppShell: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <GlobalAudioProvider>
      <div className="min-h-screen flex flex-col bg-[#F5F5F7] dark:bg-[#000000] text-neutral-900 dark:text-neutral-50 transition-colors duration-300">
        <GlassNav />
        <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-6 pb-28">
          {children}
        </main>
        <Footer />
        <ToastContainer />
      </div>
    </GlobalAudioProvider>
  );
};

export default AppShell;
