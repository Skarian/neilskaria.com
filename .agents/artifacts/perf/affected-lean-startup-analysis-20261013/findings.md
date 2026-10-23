# Affected-device lean startup findings

Keep the minimal `willReadFrequently:true` option as the best preview candidate. This pair does not materially change that decision. Retain the startup difference as an unresolved cost. Do not accept production from this pair.

The hint takes 100.3 ms longer from room creation to readiness. It takes 115.8 ms longer from creation to START entry completion. Navigation-to-START completion is 48.5 ms shorter because upstream loading differs. Do not select that favorable navigation result alone. This pair does not establish a half-second regression or a causal hint cost.

## Exact elapsed intervals

Delta means hint minus original. Values use capture timestamps and round to 0.1 ms. `metrics.json` retains subtraction precision.
| Interval (ms) | Original | Hint | Hint minus original |
|---|---:|---:|---:|
| diagnostic_to_create | 46.4 | 44.3 | -2.1 |
| create_to_context | 34.4 | 32.2 | -2.2 |
| create_to_model | 217.3 | 203.6 | -13.7 |
| model_to_assets | 539.8 | 676.6 | +136.8 |
| assets_to_compile_wait | 87.1 | 71.4 | -15.7 |
| compile_promise_wait | 0.6 | 0.5 | -0.1 |
| compile_end_to_font_wait | 0.0 | 0.1 | +0.1 |
| font_wait | 0.3 | 0.3 | +0.0 |
| fonts_to_ready | 119.3 | 112.2 | -7.1 |
| create_to_ready | 964.4 | 1064.7 | +100.3 |
| ready_to_START_DOM | 1.2 | 1.4 | +0.2 |
| START_DOM_to_entry_complete | 1018.1 | 1033.4 | +15.3 |
| create_to_START_complete | 1983.7 | 2099.5 | +115.8 |
| responseEnd_to_ready | 1104.6 | 1200.8 | +96.2 |
| navigation_to_ready | 1468.6 | 1404.6 | -64.0 |
| navigation_to_START_complete | 2487.9 | 2439.4 | -48.5 |

## Capture checks

Both files pass all assertion keywords in the supplied schema. The script also checks mode options, context attributes, marker order, bounds, progress, entry state, and dropped counts. It checks byte identity before and after analysis. It does not claim general JSON Schema support.

SourceId is `lean-canvas-hint-preview-20261013`. SchemaRevision is `lean-canvas-hint-preview-1`. Reference is `a796e9aea60def6e0849cb75a151fd6570942339`, with camera fix `042dc805`. The supplied deployment is `dpl_BdRi826ZYAwiEyaDYXuqXKLL7iSn`. Captures do not embed that deployment ID or the complete URL. Their identity and shared resource fingerprints support the supplied provenance. They cannot independently prove the hosted bytes.

Original omits context options and reports `willReadFrequently:false`. Hint requests `{willReadFrequently:true}` and reports `willReadFrequently:true`. Both report supported attributes. Both texture markers report 960x640 and `default Canvas2D`. The engine hardcodes that string for both branches. Treat it as a stale label. It does not override the actual options and attributes. No source correction occurred.

Both navigations report reload. Both have one loading-to-room transition, zero runs, and empty frame, longtask, and error arrays. Original has 21 events and hint has 19. The counts for events, frames, longtasks, and errors record dropped entries. Each is zero. Both have actual START-animation-start and START-animation-complete markers, followed by download. Neither has a START gesture. The false full-boot completion fields and unobserved full-boot markers match this procedure.

Both final snapshots are visible. Neither records a hidden state from diagnostic initialization through START completion. Original records hidden at 7437.2 ms and visible at 12926.0 ms, after entry completion at 2487.9 ms. These later changes do not invalidate startup. The recorder does not prove visibility before its initialization.

Device metadata matches: Android Chrome154, Adreno740, viewport411x784, DPR2.625, drawing buffer822x1568. Both report loaded fonts and reduced motion false. The reduced Android10 user agent does not identify the actual OS version or device model.

## Marker meanings from source

Four inspected source files match the preview manifest by size and SHA256. The files are engine.ts, diagnostic.ts, BootIntro.svelte, and boot-screen.ts. The analysis reads source but does not execute it.

- Create-to-context includes renderer creation and a scheduled yield before canvas context creation. It is not a context-call timer.
- Model-parsed follows GLTFLoader.parseAsync and progress0.75. Create-to-model includes preceding setup, model availability, and parse/decode waits.
- Model-to-assets includes scene/material preparation, bonsai and cube work, buffer submissions, image preparation, shader submissions, and scheduled yields. Assets-prepared follows image promises and progress0.9. It does not mean network completion or compile completion.
- Assets-to-compile-wait includes texture initialization and yields. Compile promise wait measures only the final Promise.all wait. Earlier compileAsync submissions occur before assets-prepared. The 0.6/0.5 ms waits do not measure total shader cost.
- Compile-end-to-font-wait includes a yield and the audio promise. Font wait measures document.fonts.ready only. The 0.3/0.3 ms waits do not prove equal resolved glyph fonts.
- Fonts-to-ready includes small warm mesh draws, a full room draw, yields, and final event setup. No marker isolates each warm draw or native completion.
- START-animation markers come from Svelte intro events. START-DOM-to-completion includes its delay and entry transition. It does not measure the GBA boot animation or displayed-frame completion.

## Resources and limits

All 30 immutable paths and encoded sizes match, including the engine chunk, model, font, images, audio, and worker. Both have 30 zero-transfer entries with positive encoded size. This supports browser cache reuse. It does not prove identical decode, font, shader, driver, or OS cache state.

Each Draco file transfers 300 bytes with a larger encoded body. These are consistent with validation overhead, not fully uncached payload downloads. Response status and cache headers are absent. Original has five positive-transfer positive-body entries. Hint has three. The two extra original entries are version checks after startup. These totals are not startup payload counts.

The model resource takes 28.2 ms in both files. It ends at 490.7/326.7 ms, original/hint. Model-parsed follows its end by 230.8/216.8 ms. The engine chunk ends at 476.5/314.1 ms. Resource completion does not measure import execution. The font resource has zero duration in both files.

The last valid room asset is gba-boot audio. It ends at 567.8/339.7 ms. Assets-prepared follows by 693.5/880.4 ms. Room-ready follows by 900.8/1064.9 ms. All room image/audio resource entries finish before model-parsed. In hint, these resources finish 0.2 ms before room creation. Fetch completion does not mean decode or application preparation completion. Earlier resource availability and different order remain confounds.

Each capture has one negative worker duration: original -42.9 ms and hint -31.7 ms. The script retains each raw entry and excludes it from interval arithmetic. It does not change the anomalous timestamp. Feedback JavaScript, feedback iframe, Vercel runtime requests, and application version checks also appear. These files do not isolate their CPU cost.

No recorded longtask rules out only recorded main-thread longtask evidence. It does not rule out browser, driver, GPU, scheduler, or shorter-task waits. This pair has no GBA animation frames by design. It cannot measure boot smoothness, native execution, physical presentation, or cold startup. The user supplied the same-tab procedure. Captures do not contain a tab ID or the preceding confirmation click.

## Relation to prior evidence

Keep the earlier three-mode build separate. That build measured original1107.7 and hint1257.5 ms from creation to readiness, a +149.8 ms observation. Its fonts-to-ready gap was +113.3 ms, with a 126 ms longtask. Initial site/room state, resources, and order differed.

This matched room-entry pair measures original964.4 and hint1064.7 ms, a +100.3 ms observation. Its fonts-to-ready delta is -7.1 ms. Its largest positive internal delta is model-to-assets +136.8 ms. The earlier final-preparation gap does not recur. Do not pool these builds or assign either delta to the option alone.

Prior accepted animation evidence still favors hint: text means16.683/16.685 ms versus original33.905/32.682 ms, first/replay. Hint has zero text intervals >=42 ms. The user reports original as slower and hint/GPU as about the same. This startup-only pair neither repeats nor contradicts that motion evidence. GPU remains an experiment with extra code, memory, and observed startup cost.

Accept this pair as a valid warmed, matched room-entry startup check. Keep the one-option hint as the lean preview candidate. No additional capture matrix is essential for that bounded choice. Native cause, causal startup cost, cold startup cost, and production acceptance remain unresolved. The proposed application patch remains separate and unapplied. Rejected HEAD d82230a remains unchanged per task context.
