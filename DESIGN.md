---
version: alpha
name: Once Film
description: A dark, cinematic event-sharing system with elegant serif headlines and quiet utility text.
colors:
  primary: "#FFFFFF"
  secondary: "#B3B3B3"
  tertiary: "#E87D3E"
  neutral: "#0D0D0D"
  surface: "#111111"
  on-surface: "#FFFFFF"
  border: "#374151"
  muted: "#6B7280"
  card: "#0D0D0D"
  error: "#FF5A5F"
typography:
  headline-display:
    fontFamily: "Rosemartin Regular"
    fontSize: "52px"
    fontWeight: 400
    lineHeight: "57.2px"
    letterSpacing: "0px"
  headline-lg:
    fontFamily: "Rosemartin Regular"
    fontSize: "40px"
    fontWeight: 400
    lineHeight: "50.4px"
    letterSpacing: "0px"
  headline-md:
    fontFamily: "Rosemartin Regular"
    fontSize: "31px"
    fontWeight: 400
    lineHeight: "37px"
    letterSpacing: "0px"
  headline-sm:
    fontFamily: "sans-serif"
    fontSize: "23px"
    fontWeight: 400
    lineHeight: "28px"
    letterSpacing: "0px"
  body-lg:
    fontFamily: "Pretendard Light"
    fontSize: "18px"
    fontWeight: 300
    lineHeight: "28.8px"
    letterSpacing: "0px"
  body-md:
    fontFamily: "Pretendard Light"
    fontSize: "16px"
    fontWeight: 300
    lineHeight: "25.6px"
    letterSpacing: "0px"
  body-sm:
    fontFamily: "Pretendard Light"
    fontSize: "14px"
    fontWeight: 300
    lineHeight: "22.4px"
    letterSpacing: "0px"
  label-lg:
    fontFamily: "sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "18px"
    letterSpacing: "0.08em"
  label-md:
    fontFamily: "sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "16px"
    letterSpacing: "0.06em"
  label-sm:
    fontFamily: "sans-serif"
    fontSize: "12px"
    fontWeight: 300
    lineHeight: "16px"
    letterSpacing: "0.04em"
  caption:
    fontFamily: "Pretendard Light"
    fontSize: "12px"
    fontWeight: 300
    lineHeight: "16px"
    letterSpacing: "0px"
rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 20px
  xl: 28px
  full: 9999px
spacing:
  xs: 10px
  sm: 18px
  md: 32px
  lg: 50px
  xl: 70px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.tertiary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.lg}"
    padding: "17px 24px 18px"
    height: "58px"
    width: "284px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    padding: "17px 24px 18px"
    height: "58px"
    width: "284px"
  button-link:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.none}"
    padding: "0px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: "16px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.sm}"
    padding: "14px 16px"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: "8px 12px"
  qr-card:
    backgroundColor: "#3A3A3A"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xl}"
    padding: "12px"
---

# Once Film

## Overview

Once feels cinematic, premium, and quietly playful: a dark-mode product that treats event memories like a curated film still rather than a utility dashboard. The composition is spacious and theatrical, with a strong editorial hero, restrained navigation, and a single high-contrast primary action. It is aimed at hosts and guests who want something polished, private, and easy to use without feeling technical.

## Colors

- **Primary (#FFFFFF):** Used for the brightest text and the main call-to-action; it creates the crisp, high-contrast “spotlight” effect that drives the interface.
- **Secondary (#B3B3B3):** A soft gray for supportive copy and secondary metadata, helping the content hierarchy feel calm instead of crowded.
- **Tertiary (#0000EE):** A vivid electric blue accent that reads as the brand’s interactive signal color, best reserved for links, emphasis, and subtle highlights.
- **Neutral (#0D0D0D):** The core background tone; nearly black, it gives the whole site a cinematic, gallery-like atmosphere.
- **Surface (#111111):** A slightly lifted dark surface for containers and controls, used to separate elements without breaking the dark field.
- **On-surface (#FFFFFF):** The default readable color on dark panels and cards.
- **Border (#374151):** A low-key cool border that appears only where structure is needed, avoiding heavy framing.
- **Muted (#6B7280):** A quieter supporting gray for tertiary text or inactive states.
- **Error (#FF5A5F):** Reserved for destructive or invalid states; it should stay rare so the palette remains elegant.

## Typography

The system combines a high-fashion serif for headlines with a light sans-serif for body and utility text. `headline-display`, `headline-lg`, and `headline-md` use Rosemartin Regular to create the expressive, editorial voice seen in the hero headline and product storytelling. Body copy uses Pretendard Light for a smooth, understated reading experience, while labels and navigation lean on compact sans-serif text with slight letter spacing to feel modern and refined.

Headings are sentence-case and generous in scale, with no visible all-caps treatment for major messages. Small UI labels and navigation items rely on increased tracking to stay legible against the dark background and to add a premium, tech-forward rhythm.

## Layout

The layout is centered and hero-led, with a wide desktop canvas and a strong vertical stack: navigation at the top, headline and supporting copy in the middle, then CTA and device mockup below. Content is surrounded by ample negative space, making the page feel spacious rather than dense.

Spacing follows a loose but deliberate rhythm based on the `xs` through `xl` scale, with visible leaps between major content blocks. Cards and controls use compact internal padding, while section-level spacing remains large to preserve the cinematic presentation. Layout should favor fixed-feeling centered compositions over tight multi-column grids.

## Elevation & Depth

Depth is achieved mostly through contrast, layering, and borders rather than heavy shadow. The UI stays intentionally flat, which suits the dark theme and keeps attention on typography and imagery. Subtle tonal separation between `neutral`, `surface`, and card areas provides enough structure without adding visual noise.

The phone mockup and floating event cards create a sense of stacked media, but the components themselves remain minimally adorned. Use borders sparingly and avoid aggressive shadows; the brand should feel polished, not glossy or skeuomorphic.

## Shapes

The shape language is softly rounded and friendly, especially for primary calls to action and media containers. `rounded.lg` and `rounded.xl` define the most visible interactive and showcase elements, while `rounded.sm` keeps secondary controls crisp and understated.

Overall, the system balances rounded comfort with a composed, editorial restraint. Avoid sharp corners on prominent surfaces unless the component is intentionally secondary or utility-focused.

## Components

Buttons are highly contrasted and minimal. `button-primary` is the main conversion action: white background, dark text, generous horizontal padding, and a large pill-like radius for a clear invitation to act. `button-secondary` is outlined and transparent for less prominent actions, while `button-link` is plain text for navigation or lightweight affordances. Keep button labels short and centered, and preserve the measured height so they feel substantial on desktop and mobile.

Cards should use `card` styling: dark surface, thin border, modest padding, and no shadow. They can hold event previews, metadata, or feature summaries, but should never compete with the hero headline. Media cards and preview tiles may use `qr-card` or `chip` styles where a friendlier, more tactile surface is needed.

Inputs should remain simple and dark, with clear text contrast and subtle boundaries. Use them as low-noise forms rather than decorative fields. Focus states should be visible through border or color change, not shadow.

Chips, tags, and compact badges should be pill-shaped, small, and lightly spaced. They are best used for status, metadata, or quick filters. Icons should stay minimal and monochrome, matching the restrained utility language of the rest of the UI.

Navigation links should remain airy and letter-spaced, with minimal chrome. Keep interactive states subtle and avoid over-animating, since the brand depends more on composition and typography than on motion-driven flourish.

## Do's and Don'ts

- Do keep the page dark, cinematic, and spacious, with a strong centered hero.
- Do use the serif headline styles for major marketing statements and the light sans-serif for support copy.
- Do reserve white for the most important text and primary action surfaces.
- Do use the electric blue accent sparingly for links or emphasis, not as a large fill color.
- Do keep cards and controls flat, with borders and tonal contrast instead of shadows.
- Don't introduce bright, saturated colors beyond the established accent and error tone.
- Don't crowd the layout with dense grids, large numbers of competing CTAs, or heavy chrome.
- Don't replace the rounded, soft button and card language with sharp, angular UI.
