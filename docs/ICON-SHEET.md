# P4A civic icon sheet

Generated on 2026-11-07 using the built-in `image_gen.imagegen` tool. No image generation CLI, SVG substitution or raster post-processing was used. The final PNG was copied unchanged from the tool output and the original was retained.

- Asset: `public/artwork/p4a-civic-icons-v1.png`
- Dimensions: 1254 × 1254 pixels
- Format: PNG, RGBA; alpha extrema 0–255 (actual transparency)
- Final source: `C:\Users\Aura2020\.codex\generated_images\01a1b4e7-6ef1-72b1-b394-411cde224b33\exec-516adbee-cfec-4ac6-b9f2-321879165032.png`
- Original generation source: `C:\Users\Aura2020\.codex\generated_images\01a1b4e7-6ef1-72b1-b394-411cde224b33\exec-53517847-f422-4278-bab4-d8ee392f00b4.png`

## Inspection and integration

All sixteen meanings are distinct and arranged in four rows and four columns. A second ImageGen pass reduced the artwork to leave generous gutters. The generator did not centre the visible artwork exactly in the mathematical quarter-grid cells. Use the measured positions below with a `background-size: 627% 627%` to frame each complete icon in a 200-pixel square viewport within the unchanged full sheet. Positions are based on the main opaque artwork bounds, measured without modifying the raster. There are faint semi-transparent edge pixels; inspect contrast against the app background at actual navigation size.

The island/workshop icon is a conceptual local-node illustration; it does not document an operating physical facility.

| Index (0-based) | Meaning | Row / column | Centre x / y (px) | CSS background-position |
|---|---|---|---|---|
| 0 | home | 1 / 1 | 180 / 196 | 7.5901% 9.1082% |
| 1 | projects | 1 / 2 | 484.5 / 199 | 36.4801% 9.3928% |
| 2 | priorities | 1 / 3 | 774.5 / 193 | 63.9943% 8.8235% |
| 3 | people | 1 / 4 | 1062 / 197 | 91.2713% 9.203% |
| 4 | groups | 2 / 1 | 178.5 / 487.5 | 7.4478% 36.7647% |
| 5 | contributions | 2 / 2 | 472 / 485.5 | 35.2941% 36.575% |
| 6 | transparency | 2 / 3 | 781 / 486.5 | 64.611% 36.6698% |
| 7 | ideas | 2 / 4 | 1062 / 484 | 91.2713% 36.4326% |
| 8 | constitution | 3 / 1 | 187.5 / 776.5 | 8.3017% 64.1841% |
| 9 | membership | 3 / 2 | 480.5 / 771 | 36.1006% 63.6622% |
| 10 | strange-but-true | 3 / 3 | 772 / 772 | 63.7571% 63.7571% |
| 11 | jra | 3 / 4 | 1062 / 770.5 | 91.2713% 63.6148% |
| 12 | missing-middle | 4 / 1 | 189 / 1062 | 8.444% 91.2713% |
| 13 | verse-box | 4 / 2 | 485 / 1059.5 | 36.5275% 91.0342% |
| 14 | legal | 4 / 3 | 770 / 1061 | 63.5674% 91.1765% |
| 15 | household-bills | 4 / 4 | 1064 / 1062.5 | 91.4611% 91.3188% |

## Original generation prompt

```text
Use case: stylized-concept.
Asset type: one production-ready civic navigation icon SPRITE SHEET.
Create a single SQUARE PNG with a genuine transparent background and EXACTLY SIXTEEN distinct colourful illustrated icons, arranged in an exact 4-column by 4-row grid of equal square cells. The image will be sampled directly as a CSS sprite: every icon must be centred at the exact centre of its cell; occupy only the central 70 percent of each cell; leave completely transparent, even gutters. No title, labels, letters, numbers, watermark, visible grid, border or background shapes. No crossing between cells.

Style: a cohesive mature friendly civic illustration family, rounded flat/isometric cut-paper forms with restrained dimensional shading, bold clean silhouettes and simple details legible at 36–48 pixels. Rich purple and plum, turquoise teal, coral, golden yellow and fresh leaf green. Clear contrast against either cream or dark purple. Consistent visual weight and scale. Do not reuse the same book, folder or generic symbol for multiple meanings. Do not put icons inside badges or tiles.

Exact row-major order:
ROW 1:
1. HOME / workspace: welcoming purple house with a small golden sunrise.
2. SHARED PROJECTS: colourful interlocking construction blocks with a small rolled blue plan; no folder.
3. URGENCY AND IMPORTANCE: a compass with a clear red needle and a golden star.
4. PEOPLE AND RELATIONSHIPS: two distinct human busts with a small speech bubble.
ROW 2:
5. LOCAL GROUPS: a cluster of three colourful homes with one leafy green tree.
6. VOLUNTARY CONTRIBUTION: a helping hand cradling a golden clock.
7. OPEN TRANSPARENCY: a magnifying glass examining a clear financial ledger/checklist.
8. CONNECTED IDEAS: a constellation of coloured connected nodes around a glowing lightbulb; no book.
ROW 3:
9. CONSTITUTION WORKBENCH: a parchment document with a purple feather quill and small wax seal; no book.
10. MEMBERSHIP: a portrait membership card with a purple identity badge; clearly a card, not a second pair of people.
11. STRANGE BUT TRUE LOCAL NODE: a small conceptual island community workshop surrounded by turquoise water, with a sun and three connected nodes. A symbolic local doorway, not a photorealistic established facility.
12. JOYFUL RESPONSIBLE ABUNDANCE: a golden sun rising above welcoming hands and green growth.
ROW 4:
13. MISSING MIDDLE INFRASTRUCTURE: a compact shared computer rack with a leaf and small community connections.
14. VERSE BOX: a welcoming purple portable booth with a visible screen and a small spark of curiosity, no medical equipment.
15. LEGAL RESEARCH: balance scales alongside a small source document.
16. HOUSEHOLD BILL CHECK: a house with an itemised receipt.

Check count and positions: four rows, four columns, sixteen objects, consistent equal spacing. Crisp, polished, colourful, descriptive. Real alpha transparency everywhere outside the icon artwork.
```

Tool options: `transparent_background: true`; new image, no reference images.

## Gamify Democracy extension

`public/artwork/gamify-democracy.svg` is a separate code-authored vector icon: a gold star above purple, teal and rose podiums. It gives Gamify Democracy a distinct navigation symbol without changing the generated sheet or reusing another destination's icon. Visible navigation text remains the primary description.

## Layout refinement prompt

```text
Refine this existing 4 by 4 civic icon sprite sheet. Keep ALL SIXTEEN illustrated icon identities, exact row-major order, colour palette, style and actual transparent background unchanged. This is an engineering production sprite layout correction.

Make every icon MUCH SMALLER within its cell: each complete icon silhouette including sun, leaves, embellishments and shadow must fit inside the central 62 percent of a cell. That means generous completely empty transparent margins of at least 19 percent of the cell width on every side. Each icon must be centred in its exact square quarter-grid cell. Maintain a square canvas, EXACTLY four columns and four rows, with cell centres at 12.5%, 37.5%, 62.5%, 87.5% across and down. No artwork may touch or approach the cell boundaries or image perimeter. All gutters should be visibly generous and perfectly clean.

Remove all scattered pixels, white ragged halos, noise, speckles and floating stray marks. Crisp smooth alpha edges only. Completely transparent empty space. Do not add a background, checkerboard, tile, divider or grid. Do not crop any symbol. Do not add text, letters, numbers or labels. Preserve every distinct concept and icon order. Prioritise exact clean aligned sprite spacing over filling the image.
```

Tool options: `transparent_background: true`; reference image was the first generated PNG at `public/artwork/p4a-civic-icons-v1.png`. The reference was inspected before editing. The final output replaced that copied asset while preserving both originals under the generated-images directory.
