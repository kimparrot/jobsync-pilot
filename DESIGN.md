# Rolefield design foundation

Provisional working name. This document records the presentation shell for an invited-user job-search and application workspace. It is not a trademark, domain, or shipping-name claim.

**Status:** presentation foundation only. Auth, invite gating, voice, in-product feedback, and document-model data changes are owned elsewhere and are **not shipped** by this work.

**Locale assumption:** English UI. When examples appear in product copy later, prefer Sweden/EU context (Stockholm, Göteborg, EUR, hybrid/remote within the EU). This shell does not add example content.

---

## 1. Product frame

Rolefield is a calm professional workspace for tracking roles, applications, and the documents around them. The shell should feel like a desk you return to daily, not a marketing landing page and not a generic purple SaaS dashboard.

What this foundation does:

- Own-brand colour, type, and a small SVG mark
- Desktop rail (expanded and collapsed) plus a mobile navigation sheet
- Visible keyboard focus and reduced-motion on chrome transitions

What this foundation does not do:

- Invent navigation items, disabled “coming soon” links, or decorative metrics
- Change routes, hrefs, developer-only filtering, sign-out, or the user menu
- Implement search, invite-only access, voice, or feedback collection
- Collapse source, profile, layout, and job-output into one concept (see §7)

---

## 2. Brand

| Token | Value |
| --- | --- |
| Name | Rolefield (provisional) |
| Tagline in chrome | Job search workspace |
| Mark | Rounded square, rust plate, three cream “field rows” of uneven length |
| Voice (copy, later) | Direct, unhurried, specific. No coach-speak. |

The mark is inline SVG in `Brand.tsx` (no image asset, no network font). It is used in the desktop rail, the mobile sheet header, and the top bar. Collapsed rail shows the mark only; the wordmark stays in the tree at `opacity-0` so the width animation does not remount.

Auth screens, document titles, and package metadata still say JobSync until those owners pick up the name. Do not treat a mixed name as a bug in this job.

---

## 3. Colour

Tokens live on `:root` / `.dark` in `src/app/globals.css`. Components use semantic utilities (`bg-card`, `text-muted-foreground`, `ring-ring`), not raw hex.

| Role | Light | Dark | Use |
| --- | --- | --- | --- |
| Canvas `--background` | Warm off-white `36 28% 96.5%` | Deep ink `222 28% 7%` | App field behind content |
| Surface `--card` | White `0 0% 100%` | Elevated ink `222 26% 10%` | Content panels |
| Ink `--foreground` / `--primary` (light) | `222 38% 12%` / `222 42% 18%` | Cream / inverted ink | Body text; primary actions |
| Nav `--nav` | Ink `222 38% 13%` | Ink `222 32% 9%` | Desktop rail and mobile sheet |
| Brand `--brand` | Rust `22 58% 42%` | Amber-rust `24 68% 56%` | Mark, active tick, focus ring |
| Border | Warm hairline `36 14% 86%` | Ink hairline `222 18% 18%` | Dividers |

**Contrast:** muted text is kept darker (light) / lighter (dark) than a typical placeholder grey so body-adjacent chrome meets a 4.5:1 target against canvas and nav. Focus ring uses brand rust/amber against both canvas and nav.

**Nav token remap:** `.shell-nav` reassigns `--background`, `--foreground`, `--muted-foreground`, `--accent`, `--ring`, and `--primary` to the ink set. Existing utilities on the rail — including the user menu trigger, which this job does not own — inherit the remap. Portaled dropdowns and tooltips keep page tokens, so menus stay on the light/dark content surface.

Do not introduce purple gradients, neon glows, or a second accent.

---

## 4. Type

| Role | Face | Treatment |
| --- | --- | --- |
| Body, UI, tables | Local Inter (`--font-inter`, already bundled) | Regular/medium, default tracking |
| Display / wordmark | `--font-display` | Semibold, `letter-spacing: -0.025em` via `text-display` |

`--font-display` prefers a local editorial serif (Iowan / Palatino / Georgia) and falls back to Inter. No Google Fonts, no new npm font packages, no runtime font fetch.

Hierarchy in the shell:

- Wordmark: `text-display` at 15–16px
- Nav labels: 14px, medium implied by colour rather than weight
- Page titles stay with existing `header-title` utilities (Inter semibold)

---

## 5. Spacing and motion

| Measure | Value |
| --- | --- |
| Header height | 56px (`h-14`) |
| Expanded rail | `w-56` (existing `APP_CONSTANTS`) |
| Collapsed rail | `w-14` (icon column; labels fade, they do not unmount) |
| Nav row | 40px desktop (`h-10`); 44px mobile sheet (`min-h-11`) |
| Sheet width | `min(100%, 20rem)`, no horizontal overflow |
| Radius | `--radius: 0.5rem` |

Motion: width and opacity on the rail use `motion-safe:` duration 200ms. `prefers-reduced-motion: reduce` collapses those durations on `.navlink`, `.shell-nav`, and `.shell-header`. Do not animate content pages from this shell.

---

## 6. Shell components and states

Built from the existing Header / Sidebar / NavLink / SidebarToggle / Sheet / Tooltip pattern. No new component library.

### Desktop rail

- Ink surface, brand mark, wordmark, existing `SIDEBAR_LINKS` in order.
- Developer Options remains gated with the existing `item.devOnly && process.env.NODE_ENV !== "development"` check. Do not restyle it as a separate product area in the career nav; it is developer feedback, not the assistant.
- Active route: `aria-current="page"`, rust tick on the leading edge, raised `--accent` fill. `/dashboard` matches exactly so it does not prefix-match every child route.
- Collapsed: tooltips on the right; labels `opacity-0`; mark remains centred in the 56px column; no overflow.
- User menu and sign-out stay at the foot of the rail with current behaviour.

### Top bar

- Sticky on small screens; static in the existing desktop inset gap.
- Mobile: 44px menu button opens a left sheet (same links, same hrefs).
- Desktop: `SidebarToggle` (`⌘B` / `Ctrl+B` already handled in `SidebarContext`).
- Assistant trigger (`AgentChatTrigger`) stays on the right. The assistant is a right-rail tool, not a nav item, and is not mixed with Developer Options.

### Mobile sheet

- Ink surface (`.shell-nav`), brand row, close control from Sheet.
- Links are full-width rows with icon + label, `min-h-11`, visible focus ring.
- `SheetClose` wraps each link so choosing a route dismisses the sheet (unchanged).

### Focus and keyboard

- `navlink` utility: `focus-visible` ring using `--ring` (brand) and offset against the local `--background`.
- Toggle and sheet trigger use the existing Button focus ring, with a 44px hit area on the mobile trigger.
- Do not remove `aria-expanded` / `aria-controls` on the desktop toggle.

### States this shell must show clearly

| State | How |
| --- | --- |
| Current page | `aria-current`, rust tick, accent fill |
| Hover | Foreground step-up; no scale bounce on the mark |
| Collapsed | Tooltip + faded label + persistent mark |
| Mobile open | Sheet + scrim (Sheet default overlay) |
| Reduced motion | No 200ms width/opacity slide |

Search remains out of the top bar. A focused search field is a later input; do not ship a dummy search or a commented control.

---

## 7. Document concepts (not implemented here)

Keep these distinct in future product work. The shell does not merge them into one “Resume” blob or one nav item.

| Concept | Meaning |
| --- | --- |
| Source | Canonical facts about the person (roles held, education, skills) |
| Profile | How those facts are selected and ordered for a purpose |
| Layout | Visual arrangement for an export (page geometry, typography of the artifact) |
| Job output | A specific artifact aimed at a role (resume or letter instance) |

Navigation today still uses the existing Profile route. Relabelling or splitting that IA is a later design input, not this job.

---

## 8. Source research and limitations

**LeaseKit (completed, reused):** consistent sidebar + top bar + mobile sheet; progressive disclosure (collapsed rail, tooltips, sheet); focused search rather than a persistent global field; explicit empty/active/current states; developer feedback kept out of the career assistant.

**LinkedIn:** intended primary visual reference for density, hierarchy, and professional chrome. **External-reference inspection is pending.** Rip is researching live screens and tools through an existing manual relay. This document does **not** claim firsthand LinkedIn observation. Decisions above are provisional and should be revisited when that inspection lands.

**Not claimed as shipped:** invite-only access, voice input, in-app feedback, or any new document-model surfaces.

---

## 9. Next design inputs

1. LinkedIn (and adjacent tool) inspection notes from Rip — density, job-list rows, application states.
2. Auth and invite surfaces (security-engineer ownership) aligned to these tokens.
3. Focused search: what it queries, where it lives, how it discloses results.
4. Profile IA vs. the four document concepts in §7.
5. Empty and error states for jobs/tasks once list density is settled.
6. Motion and reduced-motion audit on pages outside the chrome.
7. Confirmation of the Rolefield name (or replacement) before touching metadata, auth copy, or the license header.

Until those arrive, prefer restraint: keep the rail, the bar, and the sheet coherent; do not add ornament.
