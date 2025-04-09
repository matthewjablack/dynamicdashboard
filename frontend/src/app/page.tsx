"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import QueryProvider from "@/providers/QueryProvider";

export default function Home() {
  return (
    <QueryProvider>
      <main className="min-h-screen bg-gray-100">
        <DashboardLayout />
      </main>
    </QueryProvider>
  );
}
