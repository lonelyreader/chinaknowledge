# Design System: China, in Fact

> Source of truth for product interface design, visible copy, and implementation review.

## 1. Visual Theme & Atmosphere

Create an international editorial publication with a visible human network behind it. The product should feel informed, worldly, calm, and personal: closer to an independent magazine and a trusted city guide than a tourism portal, government site, corporate consultancy, or generic news feed.

- The public brand name is `China, in Fact`. Retain the comma in the wordmark and running text.

- **Density:** 5/10 — balanced editorial density with generous reading space.
- **Variance:** 7/10 — asymmetric compositions, offset columns, and varied story scale.
- **Motion:** 4/10 — restrained, purposeful transitions rather than cinematic spectacle.
- Use real editorial hierarchy: one dominant story, a small number of supporting stories, and strong section rhythm.
- People are a primary visual subject. Author identity must be present throughout the public site without turning every surface into a profile card.
- Content and people should feel discovered through curation, not retrieved from a database.

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
- Place small documentary images inline with selected display headlines on the homepage, acting as visual punctuation. On mobile these images move below the headline.
- Image captions and credits remain quiet but readable.

## 5. Public Components

- **Global navigation:** compact wordmark, six primary sections, People, language switch, and one Subscribe action. Add deeper navigation only when content scale and observed use require it.
- **Story presentation:** use scale, image ratio, rules, and whitespace. Do not wrap every story in a rounded card.
- **Section index:** strong title, one lead story, then an asymmetric editorial grid or divided list.
- **Article page:** narrow reading column, calm margin, persistent but understated author identity, clear source notes, and a quiet continuation path.
- **Author identity:** portrait, name, short identity line, topic labels, and direct external links. No follower counts or social-score treatment.
- **Newsletter module:** one field, one primary action, compact success and error states.
- **Topic filters:** short horizontal labels with clear selected state. They are secondary to the six main sections.
- **Buttons:** modest radius, flat fill, no outer glow. Active state translates down by `1px`.
- **Inputs:** visible label above, error below, accent focus ring. No floating labels.
- **Loading:** exact-dimension skeletons. No generic circular spinner.

## 6. Admin Components

- Admin screens are operational, calm, and compact. Use `Satoshi` and `Geist Mono` only.
- The author view prioritizes title, language, last edited time, and editorial status.
- The editor queue prioritizes author, submission age, main section, language, and the next editorial action.
- Status is communicated by text and shape as well as color.
- Publishing controls are unavailable to authors; the layout should make role boundaries visible through available actions.
- Classification uses one required main section plus optional topics. Do not expose a complex taxonomy tree without an observed editorial need.
- Tables collapse into stacked rows on mobile with the primary action retained.

## 7. Layout Principles

- Use a twelve-column desktop grid with a maximum content width of `1440px`.
- Reading pages use a centered text measure but retain an asymmetric page composition through author, image, and related-story placement.
- Homepage and section heroes are left-aligned or split; never centered.
- Replace repeated three-equal-card rows with a lead-and-supporting grid, offset two-column composition, or divided editorial list.
- Use spacing to group content before adding containers.
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
- Selected filters, menu state, submission status, and save confirmation need clear transitions.
- Respect reduced-motion settings.
- No perpetual animation on reading pages. A small status shimmer is allowed only for an active upload or save operation.

## 10. Visible Copy Rules

- Public copy is English or Spanish. Chinese may appear only when it is the subject of the content or part of a person’s chosen identity.
- Use short object names, section names, actions, dates, real statuses, and necessary errors.
- Do not explain the interface in the interface.
- Do not use generic product claims such as “unlock China,” “seamless insights,” “your gateway,” “all-in-one,” or “next-generation.”
- Do not add capability descriptions to cards, empty states, forms, or heroes.
- Example public labels: `Stories`, `Guides`, `Places`, `People`, `Visit`, `Move`, `Study`, `Work`, `Build`, `Subscribe`, `Read`, `About the author`.
- Example author statuses: `Draft`, `Submitted`, `In review`, `Changes requested`, `Public`.

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
- No article text inside application components as hardcoded production content.
- No instructional phrases such as “click,” “scroll,” “choose,” or “learn how this works.”
