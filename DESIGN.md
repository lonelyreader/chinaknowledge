# Design System: China, in Fact

> Source of truth for product interface design, visible copy, and implementation review.

## 1. Visual Theme & Atmosphere

A global China information and people hub. Visitors find what they need, discover someone worth knowing, and continue into a deeper relationship. Selection, verification, and maintenance are operating mechanisms, not a reason to frame the brand as an editorial publication or media brand.

- Internal brand context lives in [`docs/product-brief.md`](docs/product-brief.md#内部品牌语境非对外文案); it guides design but is never copied into public UI.
- The public brand name is `China, in Fact`. Retain the comma everywhere.
- The public wordmark is the fixed outlined asset at `apps/web/public/brand/china-in-fact-wordmark.svg` — artwork, not a font; never re-typeset or rebuild from HTML text. Ink covers the base name; cinnabar only `h`, the first `i`, the comma, and `act` (`hi, act`). Header and Footer share the asset.
- The visual container is Song-dynasty editorial (水墨丹青): color from ink-painting theory, layout from album leaves and negative space, signatures from seal carving. Target texture: Hansheng magazine, Song album leaves, Zhonghua Book Company — never tourist chinoiserie. Content stays contemporary and documentary; the mono metadata layer is the modern counterweight.
- Every public screen must answer "who is behind this, and how do I reach them." The site is a bridge and router to real people, not a self-contained publication (ADR-0011).
- **Density** 5/10, **Variance** 7/10 (asymmetric compositions, varied story scale), **Motion** 4/10 (restrained, purposeful).
- Real editorial hierarchy: one dominant story, few supporting stories, strong section rhythm.
- People are a primary object and the persistent human layer beneath Stories, Guides, and Places — present throughout without turning every surface into a profile card. Content and people feel discovered through curation, not retrieved from a database.
- Professionalism comes from hierarchy, editing, sourcing, and maintenance; warmth from portraits, names, locations, voices, and visible person-to-contribution links.

## 2. Color Palette & Roles

Colors derive from ink-painting theory (墨分五色) and mineral pigments. These values are the contract; on-page calibration may fine-tune within the same hue only (directional changes go through ADR-0011).

- **Paper Gray** (`#EFF0EA`) — primary canvas; Ru-ware-glaze cool gray, outside the warm-cream zone.
- **Paper White** (`#FBFBF8`) — reading surface and raised areas.
- Text uses only the five ink tones: **焦** `#1A1A16` (headlines, body), **浓** `#333330` (secondary body), **重** `#55564F` (supporting), **淡** `#8A8A80` (metadata, disabled), **清** `#C6C7BE` (single hairline color for rules and borders).
- **Seal Cinnabar** (`#A63A2B`) — only at seal size and logic: byline seals, end-of-article seal, fact marks, focus states. Never a large background or title-repeating block.
- **Azurite** (`#2F5D8A`) — institutional layer for data, charts, and community modules; the 青 of 丹青.
- Links use an ink underline, not the accent; seal red stays scarce.

Never introduce purple, neon blue, metallic gold, flag-color combinations, or decorative gradients (azurite is functional, not neon). Ink-wash texture appears only as curated image assets, never CSS gradients. Kitsch bans in section 11 apply: the reference is a discipline, not a costume.

## 3. Typography Rules

- **Display and headlines:** `Instrument Serif` at extreme scale (tiers below); scale and tightness carry the personality, never ornament.
- **Navigation, UI, body:** `Satoshi`.
- **System layer:** `Geist Mono` for kickers, dates, captions, buttons, labels, and the language switch — `12px`, uppercase, letter-spacing `0.08em`.
- **Chinese layer:** `Noto Serif SC` for hanzi in the signature system, vertical side labels, and seal marks. Chinese never replaces English/Spanish running copy (section 10).
- Fixed six-step scale; no ad-hoc sizes:
  - `display-xl` — `clamp(48px, 7vw, 80px)` / `1.0` — hero, article H1.
  - `display-l` — `clamp(36px, 4.5vw, 56px)` / `1.05` — section leads, Person name.
  - `heading-l` — `clamp(24px, 2.5vw, 32px)` / `1.15` — article H2, module titles.
  - `heading-m` — `20px` / `1.3`, Satoshi Medium — H3/H4, card titles.
  - `body` — `18px` desktop, `16px` mobile / `1.65` — long-form measure `620px` (≈65ch).
  - `meta` — `12px` mono, uppercase, `0.08em`.
- Headlines use rhythm and line breaks; extreme tiers are for lead surfaces, not every heading.
- Admin screens are sans-serif only; no serif inside operational UI.
- Never Inter, Times New Roman, Georgia, Garamond, or generic system typography as the brand voice.

## 4. Imagery

- Photography is the primary visual material; templates enforce image slots on lead surfaces. A text-only hero or cover is a fallback state, not a design choice; ink-wash texture is container only.
- Favor documentary photography of specific people and places: portraits, street details, workspaces, homes, campuses, lived environments. No skyline montages, flag imagery, map pins, or handshake stock.
- Candid author portraits with varied ages, settings, occupations, cities, and formality — never identical crops, studio lighting, or a corporate look.
- Small documentary images sit inline with selected homepage headlines as visual punctuation (below the headline on mobile, per section 8).
- Captions and credits stay quiet but readable.

## 5. Public Components

- **Global navigation:** compact wordmark, four object sections (`Stories / Guides / Places / People`), language switch, one Subscribe action. Purpose and Topics are secondary discovery controls.
- **Story presentation:** scale, image ratio, rules, whitespace — no card around every story.
- **Section index:** strong title, one lead story, then an asymmetric grid or divided list.
- **Homepage:** the hero may pair a person with their story — photography, `display-xl` headline, signature block — left-aligned or split, never centered. An editorially weighted people passage sits with the community-live module before the page ends. Show people through what they notice or know; never announce contributor counts.
- **Homepage composition:** one scheduled lead, a small editorial selection, automatic `Recently updated` / `Latest` streams, a rotating `People to know` passage. Member stories in `Latest` show the real byline; institutional entries de-emphasize it so the stream never reads as one voice. Never expose scheduling or ranking logic.
- **Article and Guide page:** `620px` reading measure, calm margin, source notes when relevant. Signature block under the title; desktop left-rail TOC when ≥3 H2s, highlighting the current section (no progress bar). The page closes with the end seal, full author card (portrait, third-person bio, links, Discord line when active), and a routing module (related people, Discord deep link, next story) hidden when empty. Curation never replaces the member byline or pushes the person to the footer.
- **Signature block (seal system):** the site's single signature element — small cinnabar seal, mono pinyin name + hanzi + city (`WEI LAN 蔚蓝 — DONGGUAN`), one-line editorial epithet. Member articles carry it at top; institutional articles show `Related people` instead. The end-of-article mark is a seal-styled `文`. Text-only bylines may serve dense lists.
- **People index:** varied-scale portrait and contribution index — a weekly three-person Spotlight (one dominant, two supporting), then an epithet roster: `epithet — name` plus a recent-contribution link. Recently active people may get compact cards; the roster stays text-first. Never a staff directory, alumni page, marketplace, or equal avatar grid.
- **People at scale:** the Spotlight is a stable window, not a fixed trio or carousel. Follow with a compact `All people` area: name search, Topics, Places, Language, result count, explicit pagination (~24/page); each row links identity, place, topics, and a recent contribution. Never 100–200 portraits in one wall.
- **Contextual people:** content surfaces may show a few automatically matched people via their published contributions — the relationship, never scores or matching explanations.
- **Author profile:** portrait, chosen identity, location, first-person introduction, topics and places, site-selected work, complete public archive, external links. A continuing publication surface, not a résumé; unselected published work stays visible.
- **Curation distinction:** a restrained label or grouping separates site-selected work from the rest. Never describe unselected work as rejected, pending, or lower quality.
- **Community continuation:** Discord appears in exactly three evidence-based forms — fact, not adjectives. Homepage: community-live module adjacent to People (online count only above a threshold, a real topic excerpt, 3–4 member avatars). Article end: an editorial-whisper deep link ("take the question to the person who wrote this," never "join us"). Person page: a member-owned contact line, shown only while the member is active. No popups, acquisition banners, or repeated promotion.
- **Author identity:** no follower counts, ratings, availability badges, popularity rank, transaction controls, or social scores.
- **Newsletter module:** one field, one primary action, compact success/error states. Surface is ink or paper-white with a hairline; cinnabar only on the button, never the background.
- **Cover fallback:** cards and OG images without photography use the systematic fallback — paper-gray ground, curated ink-wash texture asset, seal or vertical hanzi punctuation, mono small-type title.
- **Topic filters:** short horizontal labels with clear selected state, secondary to the four object sections.
- **Buttons:** modest radius, flat fill, no outer glow; active state translates down `1px`.
- **Inputs:** label above, error below, accent focus ring; no floating labels.
- **Loading:** exact-dimension skeletons; no generic spinner.

## 6. Admin Components

- Operational, calm, compact; `Satoshi` and `Geist Mono` only.
- Member entry points are `My work` and `My profile`; members never search full CMS collections for their own records.
- `My work`: title, language, publication state, curation state, last saved, one clear next action. The focused editor supports save, preview, publish, update, withdraw — never Submit/Resubmit, approval waiting, or site-only curation fields.
- `My profile`: one direct editing task (identity, portrait, location, introduction, languages, topics, external links) with preview and publish.
- Editor candidate view: original author, recency, language, curation state, next action; distinguishes unselected/selected/editing/curated/needs recheck/removed.
- Curation detail separates reading and source checks from classification; scheduling uses a distinct confirmation showing author, locale, stable URL, sections, date, freshness.
- Status is communicated by text and shape as well as color.
- Member publication and site curation are separate controls: member publish never implies placement; Editor removal never withdraws the article. Editor edits keep the original Person as byline; editor identity lives in version/audit detail.
- Mobile supports writing, profile updates, triage, and light curation; withdraw and site-distribution need distinct confirmations. Tables collapse into stacked rows keeping the primary action.
- Classification is an Editor task: one site format plus optional Purpose/Topics/Geography/Situation; Language and Freshness stay separate fields; the taxonomy tree is not exposed to members.

## 7. Layout Principles

- Twelve-column desktop grid, maximum content width `1440px`.
- Reading pages center the text measure but keep asymmetric composition via author, image, and related-story placement.
- Replace three-equal-card rows with a lead-and-supporting grid, offset two-column composition, or divided list.
- Spacing groups content before containers. Negative space is an institution (留白): section spacing one step more generous than editorial defaults; emptiness is compositional material.
- Corner-weighted asymmetry (Ma Yuan "one-corner") grounds the lead-and-supporting grid: mass gathers in one region, the rest breathes.
- Vertical hanzi side labels (`writing-mode: vertical-rl`, Noto Serif SC) may mark sections as quiet punctuation; never navigation or required information.
- Warmth comes from proximity of portrait, name, voice, and contribution — not testimonial quotes or explanatory community copy.
- Dense People results use divided rows or a restrained two-column list; smaller portraits, readable names and links. Mobile: one column, compact filter, pagination over endless scroll.
- No overlapping elements; every block owns a clear spatial zone.
- CSS Grid for primary page structure; full-height sections use `min-height: 100dvh`.

## 8. Responsive Rules

- Below `768px`, multi-column structures become one column.
- No horizontal page overflow.
- Display type scales with `clamp()` and never forces single-word lines.
- Touch targets at least `44px`.
- Inline headline imagery moves below the headline on mobile.
- Mobile navigation is a compact menu preserving language and Subscribe.
- Long metadata rows wrap cleanly; no ellipsis on essential editorial status.

## 9. Motion & Interaction

- Subtle spring motion, baseline `stiffness: 100`, `damping: 20`; animate only `transform` and `opacity`.
- Story lists may stagger in, but reading content never waits for decoration.
- Hover reveals image or underline movement of at most `4px`.
- The article TOC highlights the current section on scroll; no top reading-progress bar.
- Outbound links carry a consistent arrow glyph and are instrumented as outbound events.
- Selected filters, menu state, publication/curation status, and save confirmation get clear transitions.
- Respect reduced-motion settings.
- No perpetual animation on reading pages; a small shimmer only for an active upload or save.

## 10. Visible Copy Rules

- Public copy is English or Spanish. Chinese appears only as content subject or a person's chosen identity.
- Short object names, section names, actions, dates, real statuses, necessary errors.
- Do not explain the interface in the interface.
- No generic product claims ("unlock China," "seamless insights," "next-generation").
- No capability descriptions on cards, empty states, forms, or heroes.
- Never call contributors a team, experts, volunteers, students, creators, or community as a blanket label; describe each person specifically.
- Example public labels: `Stories`, `Guides`, `Places`, `People`, `Understand`, `Visit`, `Live`, `Study`, `Work`, `Business`, `Subscribe`, `Read`, `About the author`.
- Member publication statuses: `Draft`, `Public`, `Withdrawn`. Site curation statuses: `Not selected`, `Selected`, `Editing`, `Site selected`, `Needs recheck`, `Removed`.

## 11. Anti-Patterns

- No emojis, pure black, purple or blue neon, outer glow, or decorative gradient text.
- No three-column equal-card rows, centered heroes, glassmorphism dashboards, or oversized pill containers.
- No generic placeholder people or fake metrics.
- No China visual clichés: dragons/phoenixes, auspicious clouds, lanterns, gilt, Forbidden-City red-and-yellow, calligraphy display faces.
- No large accent-color backgrounds (seal red only at seal size); no title-repeating cover blocks; no ink-wash CSS gradients or ink filters over photography.
- No map-first homepage; no service marketplace treatment unless separately approved.
- No corporate team grid, creator leaderboard, social feed, follower metrics, ratings, or community-member counters.
- No article text hardcoded inside application components.
- No instructional phrases such as "click," "scroll," "choose," or "learn how this works."
