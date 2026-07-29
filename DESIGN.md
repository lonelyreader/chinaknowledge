# Design System: China, in Fact

> Source of truth for product interface design, visible copy, and implementation review.

## 1. Visual Theme & Atmosphere

Create a global China information and people hub built from useful knowledge and the presence of many distinct contributors. Visitors should be able to find what they need, discover someone worth knowing, and continue into a deeper relationship. Selection, classification, verification, and maintenance keep the information useful; they are operating mechanisms, not a reason to frame the brand as an international editorial publication, media brand, or magazine.

- The internal brand context lives in [`docs/product-brief.md`](docs/product-brief.md#内部品牌语境非对外文案). It guides design decisions but must not be copied into public UI as brand description or explanatory copy.

- The public brand name is `China, in Fact`. Retain the comma in the wordmark and running text.

- The public wordmark is the approved single-line outlined asset at `apps/web/public/brand/china-in-fact-wordmark.svg`. Its custom letterforms are fixed artwork, not a font choice: do not re-typeset, redraw, substitute Instrument Serif, or rebuild it from HTML text. Charcoal Ink applies to the base name; Cinnabar applies only to `h`, the first `i`, the comma, and `act`, so the accent layer reads `hi, act` while the full name remains immediately legible. Header and Footer must use the same asset.

- **Density:** 5/10 — balanced editorial density with generous reading space.
- **Variance:** 7/10 — asymmetric compositions, offset columns, and varied story scale.
- **Motion:** 4/10 — restrained, purposeful transitions rather than cinematic spectacle.
- Use real editorial hierarchy: one dominant story, a small number of supporting stories, and strong section rhythm.
- People are both a primary object and the persistent human layer beneath Stories, Guides, and Places. Author identity must be present throughout the public site without turning every surface into a profile card.
- Content and people should feel discovered through curation, not retrieved from a database.
- Professionalism comes from hierarchy, editing, sourcing, and maintenance states. Warmth comes from portraits, names, locations, individual voices, and visible links between a person and their contributions.

## 2. Color Palette & Roles

- **Rice Paper** (`#F4F0E7`) — primary canvas; warm but not nostalgic.
- **Editorial White** (`#FFFCF6`) — reading surface and raised editorial areas.
- **Charcoal Ink** (`#1D1D1A`) — primary text and navigation.
- **Stone Gray** (`#6F706A`) — metadata, timestamps, and secondary labels.
- **Hairline Stone** (`#D8D2C7`) — rules, input borders, and structural separators.
- **Cinnabar Red** (`#B43A2F`) — the only accent; primary actions, active navigation, focus, and selected states.

Never introduce purple, blue neon, metallic gold, flag-color combinations, or decorative gradients. Cinnabar is a functional accent, not a cultural motif.

## 3. Typography Rules

- **Display and editorial headlines:** `Instrument Serif`, controlled scale, tight tracking, expressive but never ornamental.
- **Navigation, UI, and body:** `Satoshi`, neutral and highly legible.
- **Metadata:** `Geist Mono`, used sparingly for dates, issue labels, and compact editorial states.
- Headlines use weight, rhythm, and line breaks rather than oversized type alone.
- Long-form body copy has relaxed leading and a maximum measure of `65ch`.
- Public reading pages use a minimum body size of `18px` on desktop and `16px` on mobile.
- Dashboard and admin screens use sans-serif only; do not use serif inside operational UI.
- Never use Inter, Times New Roman, Georgia, Garamond, or generic system typography as the visible brand voice.

## 4. Imagery

- Favor documentary photography, portraits, street details, workspaces, homes, campuses, and lived environments.
- Show contemporary China through specific people and places. Avoid skyline montages, flag imagery, dragons, lantern clichés, map pins, and stock photos of handshakes.
- Use candid portraits for authors. Avatars should not all share identical crops or artificial studio lighting.
- Let portraits show varied ages, settings, occupations, cities, and degrees of formality. Do not make the contributor network look like a corporate team page, a school cohort, or a stock-photo directory.
- Place small documentary images inline with selected display headlines on the homepage, acting as visual punctuation. On mobile these images move below the headline.
- Image captions and credits remain quiet but readable.

## 5. Public Components

- **Global navigation:** compact wordmark, four stable object sections (`Stories / Guides / Places / People`), language switch, and one Subscribe action. Purpose and Topics appear as secondary discovery controls, not additional equal-weight sections.
- **Story presentation:** use scale, image ratio, rules, and whitespace. Do not wrap every story in a rounded card.
- **Section index:** strong title, one lead story, then an asymmetric editorial grid or divided list.
- **Homepage:** pair the dominant story with a clearly identifiable author, then include a compact, editorially selected people passage before the page ends. Show people through what they notice or know; never announce a contributor count as a marketing claim.
- **Homepage composition:** visually distinguish one scheduled lead story, a small editorial selection, automatic `Recently updated` and `Latest` streams, and a rotating `People to know` passage. Do not expose scheduling or ranking logic in public copy.
- **Article and Guide page:** narrow reading column, calm margin, clear source notes when relevant, and a visible original-author passage near the title or opening. Editorial curation or rewriting must never replace the member byline or postpone the person behind the content to the footer.
- **Compact byline:** portrait or distinctive image, full name, short identity, and city when relevant. Use it consistently on lead stories and selected index items; lighter text-only bylines may serve dense lists.
- **People index:** an editorial portrait and contribution index with varied scale, a weekly three-person Spotlight, and divided lists for the rest. The Spotlight uses one dominant person and two supporting people; every person is visibly tied to a recent contribution. It must not resemble a staff directory, alumni page, marketplace, or equal avatar grid.
- **People at scale:** the Spotlight is a stable window into the network, not a permanent featured trio or a carousel. Follow it with a compact `All people` area containing name search, Topics, Places, Language, a functional result count, and explicit pagination of roughly 24 people per page. Each row links identity, place, topics, and a recent contribution. Do not render 100–200 portraits in one continuous wall.
- **Contextual people:** Stories, Guides, Places, Topics, and Purpose surfaces may show a small number of automatically matched people through their published contributions. Present the contribution relationship, not recommendation scores or matching explanations.
- **Author profile:** portrait, chosen identity, location, readable first-person introduction, topics and places, site-selected work, the member's complete public archive, and direct external links. It is a continuing publication surface, not a résumé or social profile. Content not selected by the site remains visible here when the member has published it.
- **Curation distinction:** use a restrained label or grouping to distinguish site-selected work from the rest of a member's public archive. Never describe unselected work as rejected, pending approval, or lower quality.
- **Community continuation:** Discord may appear as one restrained continuation action after a person or story relationship is established. Do not use acquisition banners or repeated community promotion.
- **Author identity:** no follower counts, ratings, availability badges, popularity rank, transaction controls, or social-score treatment.
- **Newsletter module:** one field, one primary action, compact success and error states.
- **Topic filters:** short horizontal labels with clear selected state. Topics remain globally discoverable and secondary to the four object sections.
- **Buttons:** modest radius, flat fill, no outer glow. Active state translates down by `1px`.
- **Inputs:** visible label above, error below, accent focus ring. No floating labels.
- **Loading:** exact-dimension skeletons. No generic circular spinner.

## 6. Admin Components

- Admin screens are operational, calm, and compact. Use `Satoshi` and `Geist Mono` only.
- Member entry points are `My work` and `My profile`; do not make a member search full CMS collections for their own records.
- `My work` prioritizes title, language, member publication state, site curation state, last saved time, and one clear next action.
- The focused editor supports save, preview, publish, update, and withdraw. It must not show Submit, Resubmit, approval waiting, or site-only curation fields to an ordinary member.
- `My profile` presents identity, portrait, location, introduction, languages, topics, and external links as one direct editing task with preview and publish.
- The Editor candidate view prioritizes original author, publication recency, language, curation state, and the next site action. It distinguishes unselected, selected, editing, curated, needs recheck, and removed content.
- Curation detail separates reading and source checks from classification. Scheduling or site distribution uses a distinct confirmation state with author, locale, stable URL, selected sections, date, and freshness visible together.
- Status is communicated by text and shape as well as color.
- Member publication and site curation are separate controls. Member publish must not imply Home/Stories/Guides placement; Editor removal must not withdraw the member's article.
- When an Editor edits a member article, the original Person remains visibly fixed as the byline; editor identity belongs in version and audit detail.
- Mobile supports member writing, profile updates, candidate triage, and light curation. Withdraw and site-distribution controls require clear confirmation and must not share a single ambiguous action.
- Classification is an Editor task: one site format plus optional Purpose, Topics, Geography, and Situation. Language and Freshness remain separate fields. Do not expose this taxonomy tree to members without an observed need.
- Tables collapse into stacked rows on mobile with the primary action retained.

## 7. Layout Principles

- Use a twelve-column desktop grid with a maximum content width of `1440px`.
- Reading pages use a centered text measure but retain an asymmetric page composition through author, image, and related-story placement.
- Homepage and section heroes are left-aligned or split; never centered.
- Replace repeated three-equal-card rows with a lead-and-supporting grid, offset two-column composition, or divided editorial list.
- Use spacing to group content before adding containers.
- Create warmth through proximity between portrait, name, voice, and contribution. Do not add testimonial quotes or explanatory community copy to manufacture warmth.
- Dense People results use divided rows or a restrained two-column list; portraits become smaller but names and contribution links remain readable. Mobile uses one column, a compact filter control, and pagination rather than endless scroll.
- No overlapping elements. Every image, label, and text block owns a clear spatial zone.
- Use CSS Grid for primary page structure.
- Full-height sections use `min-height: 100dvh`, never a fixed viewport height.

## 8. Responsive Rules

- Below `768px`, all multi-column structures become one column.
- No horizontal page overflow.
- Display type scales with `clamp()` and never forces single-word lines.
- All touch targets are at least `44px`.
- Inline headline imagery moves below the headline on mobile.
- Desktop navigation becomes a compact menu with the language and Subscribe actions preserved.
- Long metadata rows wrap cleanly; no ellipsis on essential editorial status.

## 9. Motion & Interaction

- Use subtle spring motion with a baseline of `stiffness: 100` and `damping: 20`.
- Animate only `transform` and `opacity`.
- Story lists may enter with a short stagger, but reading content must never wait for decorative animation.
- Hover reveals image or underline movement of no more than `4px`.
- Selected filters, menu state, publication/curation status, and save confirmation need clear transitions.
- Respect reduced-motion settings.
- No perpetual animation on reading pages. A small status shimmer is allowed only for an active upload or save operation.

## 10. Visible Copy Rules

- Public copy is English or Spanish. Chinese may appear only when it is the subject of the content or part of a person’s chosen identity.
- Use short object names, section names, actions, dates, real statuses, and necessary errors.
- Do not explain the interface in the interface.
- Do not use generic product claims such as “unlock China,” “seamless insights,” “your gateway,” “all-in-one,” or “next-generation.”
- Do not add capability descriptions to cards, empty states, forms, or heroes.
- Do not call contributors a team, experts, volunteers, students, creators, or community as a blanket public label. Describe each person specifically.
- Example public labels: `Stories`, `Guides`, `Places`, `People`, `Understand`, `Visit`, `Live`, `Study`, `Work`, `Business`, `Subscribe`, `Read`, `About the author`.
- Example member publication statuses: `Draft`, `Public`, `Withdrawn`.
- Example site curation statuses: `Not selected`, `Selected`, `Editing`, `Site selected`, `Needs recheck`, `Removed`.

## 11. Anti-Patterns

- No emojis.
- No pure black.
- No purple or blue neon.
- No outer glow.
- No decorative gradient text.
- No three-column equal-card feature rows.
- No centered hero.
- No glassmorphism dashboard.
- No oversized pill-shaped containers everywhere.
- No generic placeholder people or fake metrics.
- No China visual clichés.
- No map-first homepage.
- No service marketplace treatment unless that product direction is separately approved.
- No corporate team grid, creator leaderboard, social feed, follower metrics, ratings, or generic community-member counters.
- No article text inside application components as hardcoded production content.
- No instructional phrases such as “click,” “scroll,” “choose,” or “learn how this works.”
