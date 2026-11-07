---
name: DevLevel Retro-Logic
colors:
  surface: '#161308'
  surface-dim: '#161308'
  surface-bright: '#3d392c'
  surface-container-lowest: '#110e05'
  surface-container-low: '#1f1b10'
  surface-container: '#231f14'
  surface-container-high: '#2e2a1e'
  surface-container-highest: '#393528'
  on-surface: '#eae2cf'
  on-surface-variant: '#d0c6ab'
  inverse-surface: '#eae2cf'
  inverse-on-surface: '#343024'
  outline: '#999077'
  outline-variant: '#4d4732'
  surface-tint: '#e9c400'
  primary: '#fff6df'
  on-primary: '#3a3000'
  primary-container: '#ffd700'
  on-primary-container: '#705e00'
  inverse-primary: '#705d00'
  secondary: '#4de082'
  on-secondary: '#003919'
  secondary-container: '#00b55d'
  on-secondary-container: '#003e1c'
  tertiary: '#defcff'
  on-tertiary: '#00363a'
  tertiary-container: '#00f1ff'
  on-tertiary-container: '#006a70'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffe16d'
  primary-fixed-dim: '#e9c400'
  on-primary-fixed: '#221b00'
  on-primary-fixed-variant: '#544600'
  secondary-fixed: '#6dfe9c'
  secondary-fixed-dim: '#4de082'
  on-secondary-fixed: '#00210c'
  on-secondary-fixed-variant: '#005227'
  tertiary-fixed: '#79f5ff'
  tertiary-fixed-dim: '#00dbe8'
  on-tertiary-fixed: '#002022'
  on-tertiary-fixed-variant: '#004f54'
  background: '#161308'
  on-background: '#eae2cf'
  surface-variant: '#393528'
  mana-blue: '#3B82F6'
  health-red: '#EF4444'
  xp-green: '#22C55E'
  level-up-gold: '#FACC15'
  dungeon-black: '#0F172A'
  village-light: '#F8FAFC'
  border-pixel: '#1E293B'
typography:
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-pixel:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.2'
spacing:
  pixel-unit: 4px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: 40px
  container-padding: 12px
---

## Brand & Style
The design system for this product is a fusion of **Retro-RPG aesthetics** and **Modern Functionalism**. It targets learners aged 13-30 by leveraging the nostalgia of 8-bit and 16-bit gaming to lower the cognitive barrier of learning programming logic. 

The visual style is **Brutalist-Pixel**: it utilizes thick, high-contrast borders and blocky containers reminiscent of classic game consoles, but maintains the whitespace and hierarchy expected of a modern SaaS application. The emotional response should be one of "Playful Mastery"—where every solved logic puzzle feels like a successful critical hit in a dungeon crawl.

**Key Stylistic Pillars:**
- **The "Bevel" Effect:** All interactive elements use a simulated 3D pixel-step border rather than traditional shadows to create depth.
- **High-Contrast Clarity:** Despite the gaming theme, UI density remains low to prevent the "overwhelming" feeling found in competitors.
- **Narrative Progress:** Interfaces are treated as game screens (e.g., "Overworld," "Dungeon," "Village") to contextualize learning modules.

## Colors
The palette is categorized by "Game Mechanics" to ensure the color-logic mapping remains consistent for the learner. 

- **Primary (Action):** Level-up Gold is used for critical path actions (Quest start, Next level).
- **Secondary (Success):** XP Green is used for progress indicators and successful logic execution.
- **Mana Blue:** Reserved for "Inventory" and "Spellbook" (Theoretical concepts/Log).
- **Health Red:** Used for "Danger" actions (Quit, Delete) and logic errors.

**Accessibility Note:** All background/foreground combinations must maintain a 4.5:1 ratio. In "Dungeon Mode" (Dark), surfaces use high-value accents. In "Village Mode" (Light), borders thicken to maintain contrast against softer backgrounds.

## Typography
The typography system balances character with readability. 

- **Headlines:** Use **Space Grotesk**. Its geometric but slightly technical feel complements the pixel-art style without the legibility issues of actual pixel fonts.
- **Body:** Use **Inter**. This ensures that complex explanations of programming logic are perfectly readable at any scale.
- **UI Accents / Code:** Use **JetBrains Mono**. This is used for "Stat Labels," "Spell Names," and any logic snippets. It provides the "Developer" feel while remaining highly accessible.

**Scaling:** On mobile, headlines scale down, but body text remains at a minimum of 16px to support the target audience's diverse accessibility needs.

## Layout & Spacing
The layout follows a **8px grid system**, but all spacing units must be multiples of the 4px "Pixel Unit" to ensure pixel-perfect alignment of 8-bit assets.

- **Grid:** A fluid grid system with 4 columns on mobile and 12 on desktop.
- **Visual Rhythm:** Components use generous internal padding (12px minimum) to offset the "heavy" weight of pixelated borders.
- **Adaptive Reflow:** In the "Challenge" screen, the "Combat Scenario" (Visual) sits above the "Editor" on mobile, but moves to a side-by-side layout on tablets to maximize the workspace.

## Elevation & Depth
This system eschews soft shadows in favor of **Tonal Stacking** and **Beveled Borders**. 

- **Level 0 (Dungeon Floor):** The main background color.
- **Level 1 (Stone Slab):** Surface containers use a slightly lighter/darker tint with a 2px solid border (`#1E293B`).
- **Level 2 (Interactive):** Buttons use a 4px "Bottom Bevel"—a darker shade of the button's own color at the bottom to simulate a physical, tactile game button.
- **Active State:** On press, the button shifts down by 2px and the bevel disappears, providing "Squishy" tactile feedback.

## Shapes
The shape language is strictly **Sharp (0)**. To evoke the pixel-art theme, we avoid standard border-radii. 

Instead of rounding, "Softness" is achieved through **Pixel-Clipping**: corners can be "notched" (removing a 4px x 4px square from the corner) to create an 8-bit octagonal effect. This applies to cards, primary buttons, and the character avatar frame.

## Components
- **Primary Action (Quest Button):** Gold background, black text, 4px dark gold bottom bevel. Font: Label-pixel.
- **Status Bars:** Health (Red) and XP (Green) bars must use a "Segmented" texture. Instead of a smooth gradient, the progress is filled in 8px block increments.
- **Inventory Cards:** Use a "Dungeon Slate" background (Dark Gray/Blue) with a 2px notched border. Icons are always centered.
- **Input Fields:** Styled like a "Command Console." Deep black background, green mono-text, and a blinking underscore cursor.
- **Feedback Toasts:** "Victory" toasts use Level-up Gold with a "Level Up!" star icon. "Error" toasts use Health Red and always include a text-based explanation, never just a color change.
- **The "Logic Blocks":** Draggable components in the puzzle editor that look like physical 8-bit tiles with subtle highlights on the top edge.