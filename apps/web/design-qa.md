# Design QA — China, in Fact Wordmark

**Source visual truth**

- `/Volumes/External/chinaknowledge/outputs/logo-wordmark-study/source/approved-hi-act-source.png`
- Source pixels: `1774 × 887`; comparison crop: `1497 × 274` from `+139+295`.

**Rendered implementation**

- `/Volumes/External/chinaknowledge/docs/reference/implementation/brand-wordmark-site-integration/home-desktop-1440x900.png`
- `/Volumes/External/chinaknowledge/docs/reference/implementation/brand-wordmark-site-integration/home-mobile-390x844.png`
- Desktop screenshot pixels and CSS viewport: `1440 × 900`, density `1`.
- Mobile screenshot pixels: `390 × 843`; CSS viewport: `390 × 844`. The browser capture omitted one terminal pixel row; layout metrics use the CSS viewport.
- State: English fixture homepage, Rice Paper theme, mobile menu closed for visual comparison.

**Full-view comparison evidence**

- Desktop and mobile captures confirm the wordmark occupies the existing Header slot without changing navigation hierarchy, page composition, or responsive behavior.
- Desktop: logo `180 × 32.94` CSS px; document `scrollWidth/clientWidth = 1440/1440`.
- Mobile: logo `144 × 26.36` CSS px; document `scrollWidth/clientWidth = 390/390`.
- Footer full-page capture confirms the same SVG, alt text, color treatment, and desktop size.

**Focused region comparison evidence**

- Combined comparison: `/Volumes/External/chinaknowledge/docs/reference/implementation/brand-wordmark-site-integration/comparison-wordmark-source-vs-browser.png`.
- The source crop and browser crop were each normalized to `180 × 33` pixels before being placed in one comparison image. Left is source; right is browser.
- The custom letter contours, one-line composition, comma, and accent mapping (`h`, first `i`, comma, `act`) match. The minor tone variation is JPEG capture compression, not a token change.

**Required fidelity surfaces**

- Fonts and typography: the wordmark is outlined artwork; no font substitution or runtime font dependency exists. Surrounding navigation typography is unchanged.
- Spacing and layout rhythm: Header height remains `76.8` desktop and `64.8` mobile. The logo is vertically centered and does not compress nav or language controls.
- Colors and visual tokens: path fills are exactly Ink `#1D1D1A` and Cinnabar `#B43A2F`; no blue, gradient, or extra accent is present.
- Image quality and asset fidelity: SVG contains 14 paths with a padded tight viewBox; no raster, `<text>`, external image, custom HTML drawing, or clipping halo is present.
- Copy and content: accessible name and alt remain exactly `China, in Fact`; no explanatory UI copy was added.

**Findings**

- No actionable P0, P1, or P2 mismatch.

**Interaction and console checks**

- Header home link remains semantic and points to `/en`.
- Mobile menu opened and closed successfully; `aria-expanded` changed `false → true → false` and no overflow appeared.
- Fresh desktop and mobile browser tabs reported zero console errors or warnings.

**Comparison history**

- First formal source-versus-browser comparison passed. A pre-QA asset render showed the raw tight bounds touched the C and t edges; 16 SVG units of viewBox padding were added before browser capture, so no P0/P1/P2 iteration remained.

**Follow-up polish**

- None required for this slice.

final result: passed
