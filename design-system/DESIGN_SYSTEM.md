# Shared Design System (v1.0.0)

Product-agnostic design language for the CDMO Enterprise-AI app family. Two
independent products adopt it today — **Golden Batch Multi-Agent** and
**Deviation Review** — and any future app should too. Deploys are separate; the
*look, feel, and interaction grammar* are one.

> **The standard is the contract, not the pixels.** Products never hardcode
> colors or type. They consume the tokens and map their own meaning onto generic
> role slots. Change a token once → both apps move together.

- Canonical tokens: [`tokens.css`](./tokens.css) (CSS variables, framework-agnostic)
- Machine mirror: [`tokens.json`](./tokens.json) (Tailwind / TS / validation)
- Versioning: SemVer on `--ds-version`. Breaking = renamed/removed token or
  changed role meaning. Each product records the DS version it targets.

---

## 1. Adoption (any stack)

1. Vendor `tokens.css` into the app (copy the file, or symlink, or later a shared package).
2. Import it once at the app root (before app styles).
3. Reference `var(--ds-*)` everywhere. Tailwind users: map vars in `tailwind.config`
   (see §7). Never write raw hex in product code.
4. Support the theme toggle: honor `prefers-color-scheme` and `:root[data-theme]`.

```css
/* app globals */
@import "../design-system/tokens.css";
body { background: var(--ds-bg); color: var(--ds-text); font-family: var(--ds-font-sans); }
```

---

## 2. Color roles

| Token | Role | Do | Don't |
|---|---|---|---|
| `--ds-brand` | Primary action & product identity | Run buttons, active nav, focus | Body text, large fills |
| `--ds-bg` / `--ds-surface` / `--ds-surface-2` | Canvas → panel → nested | Layer depth | Use >3 levels |
| `--ds-border` / `--ds-border-strong` | Hairlines / input edges | 1px dividers | Heavy outlines |
| `--ds-text` / `-muted` / `-subtle` | Text hierarchy (3 levels) | Titles / labels / hints | 4th grey |
| `--ds-success/warning/danger/info` (+`-bg`) | Semantic status | Alerts, toasts, validation | Decorative color |
| `--ds-accent-1..4` (+`-bg`) | **Generic role slots** | App assigns meaning | Reuse for status |

**Role-slot mapping (this is the unifying idea).** Each product maps its own
entities onto the same accent slots, so two apps read as siblings:

| Slot | Golden Batch | Deviation Review (proposed) |
|---|---|---|
| `accent-1` (blue) | 🧮 Analysis Agent | Investigation / data |
| `accent-2` (violet) | 🧠 MSAT Agent | Assessment / SME |
| `accent-3` (teal) | (reserved) | CAPA / resolution |
| `accent-4` (amber) | (reserved) | Open / pending |

Status (open/closed/overdue, pass/fail) always uses the **semantic** tokens, never accents.

---

## 3. Typography

- Families: `--ds-font-sans` (UI), `--ds-font-mono` (IDs, code, feature names like
  `[prd_final]VCD_BI`).
- Scale: `xs 12 · sm 13 · base 14 · md 15 · lg 18 · xl 22 · 2xl 28`. Base is 14px —
  these are dense, data-forward enterprise tools.
- Weights: 400 body · 500 labels · 600 titles/emphasis · 700 sparse headline.
- Line-height: 1.25 headings, 1.5 body.

---

## 4. Shape, elevation, spacing, motion

- Radius: `sm 4` inputs/badges · `md 8` cards/buttons · `lg 12` modals/wells · `full` pills/dots.
- Elevation: `sm` resting card · `md` popovers/menus · `lg` modals. Prefer borders over shadows for flat panels.
- Spacing: 4-based scale (`--ds-space-1..8`). Panel padding 12–16, section gaps 24.
- Motion: `--ds-transition` (150ms ease) for hover/state. No gratuitous animation;
  `active`/`running` states may pulse.

---

## 5. Component patterns (contracts)

Each product implements these; the token references keep them identical.

- **AppBar** — height `--ds-appbar-h`, `--ds-surface` bg, bottom `--ds-border`.
  Left: product name (`brand` accent on the second word). Right: env/status.
- **Button** — primary: `brand` bg / `brand-fg` text, hover `brand-hover`.
  secondary: `surface` bg + `border-strong`. ghost: transparent + `text-muted`.
  radius `md`, focus `--ds-focus-ring`, `:disabled` opacity .5.
- **Card / Panel** — `surface` bg, `border`, radius `lg`, padding `space-4`,
  section heading = `xs`/600/`text-subtle`/uppercase/tracking-wide.
- **Badge / Chip** — radius `full`, `xs`, tinted `*-bg` fill + solid text color.
- **Status dot** — 8px `full`, semantic color; `done`/`active`/`pending`.
- **Entity bubble** (agent message, review note) — left border + tinted bg in the
  entity's accent slot; header = emoji + accent-colored label + muted meta.
- **Timeline** — horizontal nodes; `done` = accent tint, `active` = pulse, `pending` = neutral.
- **Input / Select** — `surface` bg, `border-strong`, radius `md`, focus ring.
- **Table** — `border` rows, `surface-2` header, mono for IDs/values.

States every interactive element must define: `default · hover · active · focus · disabled` (+ `loading` where relevant).

---

## 6. Layout & responsiveness

- Content max width `--ds-content-max` (1440); full-bleed dashboards allowed.
- Multi-panel: CSS grid; each panel scrolls independently (`min-h-0` + `overflow-y-auto`).
- Never let the page body scroll horizontally — wide content scrolls inside its own container.
- Breakpoint intent: stack panels < 768px; side-by-side ≥ 768px.

## 7. Tailwind bridge (optional)

Map tokens so utilities resolve to CSS vars (values then theme automatically):

```ts
// tailwind.config.ts
colors: {
  brand: "var(--ds-brand)",
  surface: "var(--ds-surface)",
  "accent-1": "var(--ds-accent-1)",
  "accent-2": "var(--ds-accent-2)",
  // ...
}
```

## 8. Accessibility

- Text vs background ≥ 4.5:1 (large ≥ 3:1). Token pairs are chosen to pass in both themes.
- Never encode meaning by color alone — pair with icon/label (status dot + text).
- Visible focus on every interactive element (`--ds-focus-ring`).
- Respect `prefers-reduced-motion` — disable pulses/transitions.

## 9. Governance

- One change → edit `tokens.css` **and** `tokens.json` together; bump `--ds-version`.
- Products pin the DS version they target and upgrade deliberately.
- A change is DS-worthy only if both products benefit; product-specific styling
  stays in the product (built *from* tokens, not added *to* the DS).
