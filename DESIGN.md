# Design System: China, in Fact

> Source of truth for interface design, visible copy, and review.

## 1. Visual Theme & Atmosphere

A public place to meet real Chinese people through what they do, make, ask, and publish. Home, People, and Person are connection products; Stories and Guides remain reading products. Selection and verification support trust but stay backstage.

- Internal brand context lives in [`docs/product-brief.md`](docs/product-brief.md#内部品牌语境非对外文案); it guides design but is never copied into public UI.
- The public brand name is `China, in Fact`. Retain the comma everywhere.
- The public wordmark is the fixed outlined asset at `apps/web/public/brand/china-in-fact-wordmark.svg` — artwork, not a font; never re-typeset or rebuild from HTML text. Ink covers the base name; cinnabar only `h`, the first `i`, the comma, and `act` (`hi, act`). Header and Footer share the asset.
- The public site uses one warm, contemporary product system. Connection, discovery, reading, and utility templates share the same color, type, spacing, control, and motion tokens; page purpose changes the composition, not the brand system.
- Connection surfaces use compact portraits, divided rows, clear current work, and direct continuation actions. They must not resemble a magazine profile, talent marketplace, or editorial feature package.
- Reading surfaces use the same warm foundation with a dedicated prose role and documentary photography. Reading typography never determines the hierarchy of Home, People, or Person.
- Every public screen answers "who is this, what are they doing now, and where can I continue" (ADR-0011, ADR-0012).
- **Community density** 7/10, **reading density** 5/10, **motion** 3/10.
- Community hierarchy starts with finding people, then people rows, current work, and a continuation path.
- People are the primary public object. Projects, questions, places, and stories introduce people without becoming a top-level directory or fake social graph.
- Professionalism comes from hierarchy, editing, sourcing, and maintenance; warmth from portraits, names, locations, voices, and visible person-to-contribution links.

## 2. Color Palette & Roles

Every public page consumes semantic roles. Components never select primitive colors directly.

- **Paper primitives:** `paper/0 #FFFFFF`, `paper/50 #FFFDF8`, `paper/100 #F8F4EC`, `paper/200 #F1EADF`, `paper/300 #E3DACD`.
- **Ink primitives:** `ink/950 #1F1D1A`, `ink/900 #292621`, `ink/700 #514C45`, `ink/600 #6C655D`, `ink/500 #898076`, `ink/300 #B8AEA1`, `ink/200 #D4CCC0`.
- **Cinnabar primitives:** `800 #7C2F25`, `700 #91372B`, `600 #A44535`, `500 #B45441`, `100 #F5E7E2`. Cinnabar is the brand action, link, focus, and selected-state family; it is not a large decorative field.
- **Tea status:** `700 #425C47`, `600 #55715B`, `100 #EAF1E9`. **Ochre status:** `700 #7A531E`, `100 #F6ECD9`. **Danger:** `700 #A1322A`, `100 #F8E5E2`. Status always includes text or shape.
- **Background roles:** canvas `paper/100`, surface `paper/50`, elevated `paper/0`, subtle `paper/200`, inverse `ink/950`.
- **Text roles:** primary `ink/950`, secondary `ink/700`, muted `ink/600`, inverse `paper/50`, brand `cinnabar/700`.
- **Border roles:** default `ink/200`, strong `ink/300`, focus `cinnabar/600`.
- **Action roles:** primary `cinnabar/700`, hover `cinnabar/800`, text `paper/0`; secondary surface `paper/50`, text `ink/950`.
- **Selection roles:** background `cinnabar/100`, text `cinnabar/800`.
- Body text contrast is at least `4.5:1`; primary actions and focus states meet WCAG AA.

Never introduce cold blue as the primary accent, metallic gold, flag-color combinations, decorative gradients, or a parallel page-specific palette. Ink-wash texture appears only as a curated reading asset.

## 3. Typography Rules

- **Product/UI layer:** `Geist` for navigation, controls, people, headings, cards, and normal body copy. Connection surfaces never use serif names, magazine dek, pull quote, or oversized portrait typography.
- **Reading layer:** `Newsreader` for article and biographical prose only. It supports reading rhythm without turning profiles into editorial features.
- **System layer:** `Geist Mono` for dates, compact metadata, codes, and short status labels — `12px`, letter-spacing `0.0667em` when uppercase metadata is required.
- **Chinese layer:** `Noto Serif SC` for hanzi in the signature system, vertical side labels, and seal marks. Chinese never replaces English/Spanish running copy (section 10).
- Fixed nine-role scale; no ad-hoc sizes:
  - `display` — desktop `64/68`, mobile `44/48`, tracking `-0.025em` — Home and page-entry H1 only.
  - `page-title` — desktop `48/52`, mobile `36/40`, tracking `-0.02em` — People, Person, index, utility title.
  - `section-title` — desktop `32/38`, mobile `28/34`, tracking `-0.015em`.
  - `heading` — desktop `22/28`, mobile `20/26` — rows, cards, H3/H4.
  - `body` — desktop `17/27`, mobile `16/25`.
  - `prose` — desktop `19/31`, mobile `18/29`, Newsreader, maximum `680px`.
  - `label` — `14/20`; `meta` — `12/16`; `small` — `13/19`.
- Headlines use rhythm and line breaks; extreme tiers are for reading leads and the community Home/People H1 only, not Person names or row headings.
- Admin screens are sans-serif only; no serif inside operational UI.
- Never mix in Inter, Times New Roman, Georgia, Garamond, or generic system typography as the brand voice.

## 4. Imagery

- Photography is the primary visual material; templates enforce image slots on lead surfaces. A text-only hero or cover is a fallback state, not a design choice; ink-wash texture is container only.
- Favor documentary photography of specific people and places: portraits, street details, workspaces, homes, campuses, lived environments. No skyline montages, flag imagery, map pins, or handshake stock.
- Candid author portraits with varied ages, settings, occupations, cities, and formality — never identical crops, studio lighting, or a corporate look.
- Small documentary images sit inline with selected homepage headlines as visual punctuation (below the headline on mobile, per section 8).
- Captions and credits stay quiet but readable.

## 5. Public Components

- **Global navigation:** compact wordmark, `People / Stories / Guides / Places`, language switch, `Join Discord`. Projects is not top-level.
- **Story presentation:** scale, image ratio, rules, whitespace — no card around every story.
- **Section index:** strong title, one lead story, then an asymmetric grid or divided list.
- **Homepage:** a direct people-search entry, then 4–6 continuous person rows with name, identity, location, current work and real topics or help data. Current work, Discord, community Stories/Guides, and Newsletter follow. Never lead with an Article hero, `Latest`, Spotlight, counts, or editorial selection language.
- **Article and Guide page:** `680px` maximum reading measure, calm margin, source notes when relevant. Signature block under the title; desktop left-rail TOC when ≥3 H2s, highlighting the current section (no progress bar). The page closes with the end seal, full author card (portrait, third-person bio, links, Discord line when active), and a routing module (related people, Discord deep link, next story) hidden when empty. Curation never replaces the member byline or pushes the person to the footer.
- **Signature block (seal system):** the site's single signature element — small cinnabar seal, mono pinyin name + hanzi + city (`WEI LAN 蔚蓝 — DONGGUAN`), one-line editorial epithet. Member articles carry it at top; institutional articles show `Related people` instead. The end-of-article mark is a seal-styled `文`. Text-only bylines may serve dense lists.
- **People index:** `Meet people in China`, search, compact filters, and a continuous divided list. No Spotlight, featured person, editorial verdict, member count, staff directory, marketplace, or avatar grid.
- **People at scale:** search covers name, identity, place, topics, and explicit help data; Topics, Places, and real Languages remain secondary. Paginate at about 24 desktop / 12 mobile. A row shows only fields that exist.
- **Contextual people:** content surfaces may show a few automatically matched people via their published contributions — the relationship, never scores or matching explanations.
- **Person page:** compact portrait, name, identity, location, languages/topics, one explicit Discord action when owned, then `Now`, `Can help with`, Contributions, and About. It is a connection profile, not a feature story or résumé.
- **Current work:** use the existing public contribution or later approved Project data. Hide the section when absent; never relabel an introduction as current activity or scrape Discord text.
- **Curation distinction:** a restrained label or grouping separates site-selected work from the rest. Never describe unselected work as rejected, pending, or lower quality.
- **Community continuation:** Home has one real Discord continuation module; Person has one `Connect on Discord` action only when an owned link exists. Article may use a relevant person or discussion deep link. No popup, chat mirror, fake activity, or duplicate core action.
- **Question continuation:** Reddit is not a promo module. Show a real public question only when attached to a useful person, project, or answer; omit engagement metrics and automation state.
- **Author identity:** no follower counts, ratings, availability badges, popularity rank, transaction controls, or social scores.
- **Newsletter module:** lower-priority continuation with one field, one primary action, and compact success/error states.
- **Cover fallback:** cards and OG images without photography use the systematic fallback — paper-gray ground, curated ink-wash texture asset, seal or vertical hanzi punctuation, mono small-type title.
- **Topic filters:** short horizontal labels with clear selected state, secondary to the four object sections.
- **Buttons:** modest radius, flat fill, no outer glow; active state translates down `1px`.
- **Inputs:** label above, error below, accent focus ring; no floating labels.
- **Loading:** exact-dimension skeletons; no generic spinner.

## 6. Admin Components

- Operational, calm, compact; `Geist` and `Geist Mono` only.
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

- Twelve-column desktop grid, maximum content width `1280px`; desktop gutter `48px`, mobile gutter `20px`.
- Reading pages center the text measure but keep asymmetric composition via author, image, and related-story placement.
- Use divided rows for people and contributions. Small three-column cards are allowed only for supporting current work or reading routes, never as the primary people representation.
- Spacing groups content before containers. Negative space is an institution (留白): section spacing one step more generous than editorial defaults; emptiness is compositional material.
- Reading pages may keep asymmetric compositions and quiet hanzi punctuation; community surfaces do not use vertical sidemarks.
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
- Mobile navigation is a compact menu preserving language and `Join Discord`.
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

- No emojis, blue neon, outer glow, or decorative gradient text.
- No centered community hero, glassmorphism dashboard, oversized pill containers, or editorial portrait feature on Home/People/Person.
- No generic placeholder people or fake metrics.
- No China visual clichés: dragons/phoenixes, auspicious clouds, lanterns, gilt, Forbidden-City red-and-yellow, calligraphy display faces.
- No title-repeating cover blocks, ink-wash CSS gradients, or ink filters over community portraits.
- No map-first homepage; no service marketplace treatment unless separately approved.
- No corporate team grid, creator leaderboard, social feed, follower metrics, ratings, or community-member counters.
- No article text hardcoded inside application components.
- No instructional phrases such as "click," "scroll," "choose," or "learn how this works."
