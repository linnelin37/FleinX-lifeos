// src/domain/vision.ts
import type { VisionRecord } from "../lib/visionStore";

export type MilestoneVM = { date: string; text: string };
export type PlanVM = { hoursPerWeek: number; rhythm: string; preference: string };
export type RiskVM = { risk: string; plan: string };

export type VisionVM = {
  id: string;
  title: string;
  typeLabel: string;     // "生活 / Life"
  deadline: string;

  step3: {
    northStar: string;
    metric: string;
    why?: string;
    deadline: string;
  };

  milestones: MilestoneVM[];
  plan: PlanVM;
  risks: RiskVM[];
};

function pickTypeLabel(v: any) {
  const zh = String(v?.typeZh || "");
  const en = String(v?.typeEn || "");
  if (zh && en) return `${zh} / ${en}`;
  return zh || en || "Vision";
}

function normalizeMilestones(v: any): MilestoneVM[] {
  const ms = v?.milestones;
  if (!Array.isArray(ms)) return [];

  // 新结构：{ date, text }
  if (ms.length && typeof ms[0]?.date === "string") {
    return ms.map((m: any) => ({ date: String(m.date || ""), text: String(m.text || "") }));
  }

  // Wizard 结构：{ due, title }
  if (ms.length && typeof ms[0]?.due === "string") {
    return ms.map((m: any) => ({ date: String(m.due || ""), text: String(m.title || "") }));
  }

  return [];
}

function normalizePlan(v: any): PlanVM {
  const p = v?.plan || {};

  // 新结构：{ hoursPerWeek, rhythm, preference }
  if (typeof p.hoursPerWeek === "number") {
    return {
      hoursPerWeek: p.hoursPerWeek,
      rhythm: String(p.rhythm || ""),
      preference: String(p.preference || ""),
    };
  }

  // Wizard 结构：{ minHoursPerWeek, rhythm, focus }
  return {
    hoursPerWeek: typeof p.minHoursPerWeek === "number" ? p.minHoursPerWeek : 0,
    rhythm: String(p.rhythm || ""),
    preference: String(p.focus || ""),
  };
}

function normalizeRisks(v: any): RiskVM[] {
  const rs = v?.risks;
  if (!Array.isArray(rs)) return [];

  // 新结构：{ risk, plan }
  if (rs.length && typeof rs[0]?.plan === "string") {
    return rs.map((r: any) => ({ risk: String(r.risk || ""), plan: String(r.plan || "") }));
  }

  // Wizard 结构：{ risk, response }
  if (rs.length && typeof rs[0]?.response === "string") {
    return rs.map((r: any) => ({ risk: String(r.risk || ""), plan: String(r.response || "") }));
  }

  return [];
}

export function toVisionVM(raw: VisionRecord | any): VisionVM {
  const v: any = raw || {};

  const step3 = v?.step3 || {};
  const deadline = String(step3?.deadline || v?.deadline || "2026-12-31");

  return {
    id: String(v.id || ""),
    title: String(v.title || "-"),
    typeLabel: pickTypeLabel(v),
    deadline,

    step3: {
      northStar: String(step3.northStar || ""),
      metric: String(step3.metric || ""),
      why: step3.why ? String(step3.why) : undefined,
      deadline,
    },

    milestones: normalizeMilestones(v),
    plan: normalizePlan(v),
    risks: normalizeRisks(v),
  };
}