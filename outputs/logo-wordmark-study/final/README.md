# China, in Fact wordmark — final vector direction

Approved: 2026-07-30

## Lockup

- Exact public name: `China, in Fact`
- One horizontal line; the comma remains part of the name.
- The letter contours come from the approved custom high-contrast serif image.
- No substitute font or repository display font is used.

## Secondary reading

- Cinnabar characters: `h`, the first `i`, the comma, and `act`.
- Read alone, the accent characters form `hi, act`.
- The `in` after the comma remains Charcoal Ink.
- Color is the only secondary-reading device.

## Tokens

- Rice Paper: `#F4F0E7`
- Charcoal Ink: `#1D1D1A`
- Cinnabar Red: `#B43A2F`

## Final assets

- `china-in-fact-wordmark.svg` — primary transparent vector master.
- `china-in-fact-wordmark-on-rice.svg` — vector master on the Rice Paper canvas.
- `export-manifest.json` — dimensions, hashes, provenance, and validation facts.
- `build_wordmark.py` — deterministic two-color contour builder using ImageMagick and Potrace.

The builder traces `../source/approved-hi-act-source.png`, preserving the selected custom lettering instead of re-typesetting the name. Both final SVGs contain only outlined `<path>` geometry, with no `<text>`, embedded raster image, external font, or runtime font dependency.
