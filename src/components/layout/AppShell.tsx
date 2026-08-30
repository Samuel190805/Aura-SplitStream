"use client";

import React from "react";
import { MinimalHeader } from "./MinimalHeader";
import { Footer } from "./Footer";
import { GlobalAudioProvider } from "@/components/audio/GlobalAudioPlayer";
import { ToastContainer } from "@/components/ui/Toast";
import { AmbientAudioHorizon } from "@/components/visual/AmbientAudioHorizon";
import { CustomCursor } from "@/components/cursor/CustomCursor";

export const AppShell: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <GlobalAudioProvider>
      <div className="min-h-screen flex flex-col bg-[#000000] text-neutral-50 selection:bg-apple-blue selection:text-white relative overflow-x-hidden">
        <CustomCursor />
        <AmbientAudioHorizon />
        <MinimalHeader />
        <main className="flex-1 w-full flex flex-col">
          {children}
        </main>
        <Footer />
        <ToastContainer />
      </div>
    </GlobalAudioProvider>
  );
};

export default AppShell;
