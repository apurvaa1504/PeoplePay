"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Clock, Plus, Trash2 } from "lucide-react";

interface ScheduleLineItem {
  day: string;
  startTime: string;
  endTime: string;
  breakMins: number;
}

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function ScheduleForm() {
  const router = useRouter();
  const [name, setName] = useState("Standard Shift (Mon-Fri)");
  const [lines, setLines] = useState<ScheduleLineItem[]>([
    { day: "Monday", startTime: "09:00", endTime: "17:00", breakMins: 60 },
    { day: "Tuesday", startTime: "09:00", endTime: "17:00", breakMins: 60 },
    { day: "Wednesday", startTime: "09:00", endTime: "17:00", breakMins: 60 },
    { day: "Thursday", startTime: "09:00", endTime: "17:00", breakMins: 60 },
    { day: "Friday", startTime: "09:00", endTime: "17:00", breakMins: 60 },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Automatic calculation of total weekly hours from schedule lines
  const calculateTotalWeeklyHours = (): number => {
    let total = 0;
    for (const line of lines) {
      if (!line.startTime || !line.endTime) continue;
      const [sh, sm] = line.startTime.split(":").map(Number);
      const [eh, em] = line.endTime.split(":").map(Number);
      const startMins = sh * 60 + sm;
      const endMins = eh * 60 + em;
      const diff = endMins - startMins - (line.breakMins || 0);
      if (diff > 0) {
        total += diff / 60;
      }
    }
    return Math.round(total * 100) / 100;
  };

  const weeklyHours = calculateTotalWeeklyHours();

  const handleLineChange = (
    index: number,
    field: keyof ScheduleLineItem,
    value: string | number
  ) => {
    const updated = [...lines];
    updated[index] = {
      ...updated[index],
      [field]: field === "breakMins" ? Number(value) : value,
    };
    setLines(updated);
  };

  const addDayLine = () => {
    const nextDay = DAYS_OF_WEEK[lines.length % DAYS_OF_WEEK.length];
    setLines([
      ...lines,
      { day: nextDay, startTime: "09:00", endTime: "17:00", breakMins: 60 },
    ]);
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Schedule name is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, lines }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save schedule");

      router.push("/schedules");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to save schedule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-w-3xl bg-white p-6 rounded-lg border border-[#E8E3EA] shadow-2xs"
    >
      {error && (
        <div className="p-3 bg-[#FAECEC] border border-[#E9C3C3] rounded-md text-xs text-[#9A4E4E]">
          {error}
        </div>
      )}

      {/* Basic Name and Calculated Weekly Hours Pill */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#E8E3EA]">
        <div className="flex-1">
          <Input
            label="Schedule Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Standard Full-Time (40h)"
            required
          />
        </div>

        {/* Calculated Weekly Hours prominently displayed */}
        <div className="bg-[#F1EBF3] border border-[#E0D3E3] px-4 py-2.5 rounded-lg flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#71547D] shadow-2xs">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-[#71547D] tracking-wider">
              Calculated Total Hours
            </span>
            <span className="text-lg font-bold text-[#26232A]">
              {weeklyHours} <span className="text-xs font-medium text-[#77717B]">hrs/week</span>
            </span>
          </div>
        </div>
      </div>

      {/* Weekly Schedule Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-[#77717B] uppercase tracking-wider">
            Weekly Schedule Grid (Day | Start | End | Break)
          </h4>
          <button
            type="button"
            onClick={addDayLine}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#71547D] hover:text-[#55405F] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Day
          </button>
        </div>

        <div className="border border-[#E8E3EA] rounded-lg overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F9F8FA] border-b border-[#E8E3EA] text-[#77717B] font-semibold text-[10px] uppercase">
              <tr>
                <th className="px-3 py-2.5">Day</th>
                <th className="px-3 py-2.5">Start Time</th>
                <th className="px-3 py-2.5">End Time</th>
                <th className="px-3 py-2.5">Break (Mins)</th>
                <th className="px-3 py-2.5 text-right">Day Total</th>
                <th className="px-3 py-2.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E3EA]">
              {lines.map((line, idx) => {
                // Compute day hours
                const [sh, sm] = (line.startTime || "00:00").split(":").map(Number);
                const [eh, em] = (line.endTime || "00:00").split(":").map(Number);
                const diff = (eh * 60 + em) - (sh * 60 + sm) - (line.breakMins || 0);
                const dayHours = diff > 0 ? (diff / 60).toFixed(1) : "0.0";

                return (
                  <tr key={idx} className="hover:bg-[#FCFBFD]">
                    <td className="px-3 py-2 font-medium">
                      <select
                        value={line.day}
                        onChange={(e) => handleLineChange(idx, "day", e.target.value)}
                        className="rounded border border-[#E8E3EA] px-2 py-1 text-xs bg-white text-[#26232A]"
                      >
                        {DAYS_OF_WEEK.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="time"
                        value={line.startTime}
                        onChange={(e) => handleLineChange(idx, "startTime", e.target.value)}
                        className="rounded border border-[#E8E3EA] px-2 py-1 text-xs bg-white text-[#26232A]"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="time"
                        value={line.endTime}
                        onChange={(e) => handleLineChange(idx, "endTime", e.target.value)}
                        className="rounded border border-[#E8E3EA] px-2 py-1 text-xs bg-white text-[#26232A]"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={line.breakMins}
                        onChange={(e) => handleLineChange(idx, "breakMins", e.target.value)}
                        className="w-16 rounded border border-[#E8E3EA] px-2 py-1 text-xs bg-white text-[#26232A]"
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-[#26232A]">
                      {dayHours} hrs
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        disabled={lines.length <= 1}
                        className="p-1 rounded text-[#77717B] hover:text-[#B56767] transition-colors disabled:opacity-30 cursor-pointer"
                        title="Remove day"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8E3EA]">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={loading}>
          Save Working Schedule
        </Button>
      </div>
    </form>
  );
}
