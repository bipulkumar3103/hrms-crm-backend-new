# Meaningful Enterprise UI - Standard Guidelines

This document serves as the **Design Authority** for the HRMS/CRM project. Follow these specific architectural and visual rules to maintain uniformity across all modules.

---

## 1. Core Philosophy
*   **Data Density**: Use vertical space efficiently. Prioritize data entries over decorative white space.
*   **Professional Utility**: Look like a tool for work, not a landing page. Use high-contrast headers to anchor the eye.
*   **Zero Clipping**: Containers must have `overflow: visible` (or equivalent) to ensure dropdowns, calendars, and portals are never cut off.

---

## 2. Global Colors & Variables
*   **Primary Brand**: `var(--theme-primary)` (Used for authority headers and key buttons).
*   **Secondary Tint**: `var(--theme-secondary)` or `slate-50` (Used for background strips and soft hover states).
*   **Borders**: `slate-100` or `#f1f5f9` (Light, crisp separation).
*   **Shadows**: `shadow-[0_20px_50px_rgba(0,0,0,0.04)]` (Soft, deep enterprise lift).

---

## 3. Structural Patterns

### A. The "Command Registry" Header
*   **Background**: `bg-[var(--theme-primary)]`
*   **Corners**: `rounded-t-3xl`
*   **Padding**: `px-6 py-5 sm:px-8 sm:py-6`
*   **Title**: `text-xl font-black tracking-tight text-white`
*   **Subtitle**: `text-[11px] font-bold text-white/60 uppercase tracking-widest`
*   **Identity Badges**: Use `bg-white/10` with `backdrop-blur-md` for meta-info (e.g. "Simulation Active" or "Total Logs").

### B. The Intelligence Strip (Metrics Bar)
*   **Location**: Directly below the Command Header.
*   **Background**: `bg-slate-50/30`
*   **Padding**: `px-6 py-4 sm:px-8`
*   **Border**: `border-b border-slate-50`
*   **Layout**: `flex flex-wrap items-center gap-10`
*   **Icon Color**: Match `var(--theme-primary)`.

### C. The Main Workspace Card
*   **Base**: `w-full bg-white rounded-3xl border border-slate-100 shadow-xl`
*   **Internal Padding**: `p-6 sm:p-8` (Standard Uniformity).

---

## 4. Typography Protocols
| Element | Tailwind Classes | Purpose |
| :--- | :--- | :--- |
| **Primary Title** | `text-xl font-black tracking-tight` | Module/Section Identity |
| **Action Subtext** | `text-[11px] font-bold uppercase tracking-widest` | Contextual Labels |
| **Grid Label** | `text-[10px] font-black uppercase tracking-[0.2em]` | Table/List headers |
| **Data Text** | `text-[14px] font-bold text-slate-800` | Primary table data |

---

## 5. Components & Interactions
*   **Primary Buttons**: Within the header, use `bg-white/10` with `hover:bg-white/20` and `border-white/10` for a glassmorphism effect.
*   **Action Buttons**: Use `bg-[var(--theme-primary)]` with `shadow-xl shadow-indigo-100` for main CTA buttons.
*   **Inputs**: Use `bg-slate-50` with `rounded-2xl`. On focus, transition to `bg-white` with a `border-[var(--theme-primary)]` for a high-speed "Protocol" feel.
*   **Tables**: `border-collapse`, `divide-y divide-slate-50`. No cell borders unless strictly necessary.

---

## 6. Mobile Standardization
*   **Horizontal Padding**: Never less than `px-4`. Ideally `px-6`.
*   **Vertical Scaling**: Reduce header padding by 20% on mobile to reclaim viewport.
*   **Collapsible Flow**: Horizontal strips should flex into high-density columns on small screens.
