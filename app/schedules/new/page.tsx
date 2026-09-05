"use client";

import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ScheduleForm } from "@/components/schedules/ScheduleForm";

export default function NewSchedulePage() {
  return (
    <AppShell
      breadcrumbs={[
        { label: "Operations", href: "/schedules" },
        { label: "Working Schedules", href: "/schedules" },
        { label: "New Schedule" },
      ]}
      title="Create Working Schedule"
    >
      <div className="space-y-4">
        <div>
          <p className="text-xs text-[#77717B]">
            Configure weekly work days, start and end times, and meal breaks. Weekly hours are calculated dynamically based on schedule lines.
          </p>
        </div>
        <ScheduleForm />
      </div>
    </AppShell>
  );
}
