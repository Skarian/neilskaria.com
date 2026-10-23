# GPU boot atlas experimental preview

Status: One verified READY preview. Experimental preview only. Root must inspect this evidence before user delivery.

- Default: https://portfolio-2sjb3u0sj-neil-skarias-projects.vercel.app/lab/boot
- Canvas control: https://portfolio-2sjb3u0sj-neil-skarias-projects.vercel.app/lab/boot?bootCanvas=will-read-frequently
- GPU prototype: https://portfolio-2sjb3u0sj-neil-skarias-projects.vercel.app/lab/boot?bootCanvas=gpu-atlas

Deployment ID: dpl_EqCjeR7YtX6dxFnUNuGbeYc6Fces. Existing portfolio project and neil-skarias-projects scope. No production deployment or setting change occurred.

The current corrected manifest supplied all 96 upload files. All hashes passed before and after copying, and again after deployment.
Stage digest: 4901a46fafd9b0dc40ee43137314ca655399d9fddb422e948a6f1953fb23b07c.
Source ID: canvas-control-93+gpu-atlas-failure-correction-20261012.
The original prototype manifest was not used for upload. Original stages remain unchanged.

## Hosted evidence

- deployment.json, deploy.log and inspect.log record READY, one dispatch, hosted Linux source building, 96 deployment files, adapter packaging and precompression.
- hosted-packaging.json records HTTP 200 for root, all three boot URLs, PNG and compressed model. The PNG is exactly 37,034 bytes with the reviewed SHA256. The Brotli response has the correct headers and decodes to the exact source model.
- hosted-validation.json contains 93 passing checks for canvas control and GPU. Each completes trusted START, site, BACK, room, full second START and site. All expected phases, return frames, completion fields, per-run markers and session markers pass. Errors and dropped counts are zero.
- hosted-*-sample.json and downloads/ retain four JSON files, including both actual user-triggered browser downloads. schema-mode-startup-validation.json records revised schema and original structural compatibility checks. The validator implements the used rules and is not a complete JSON Schema implementation.
- GPU records one atlas texture request and one submission per session. Boot canvas paintMs, requests and submissions are zero. No canvas markers are fabricated. Browser network evidence contains one atlas response in the GPU session.
- functional-screening.json and nine functional-*.png images record separate mobile emulation functional checks for all three modes. These sessions reach START and site with the corrected source ID and no runtime errors. They are excluded from timing evidence.
- final-verification.json records unchanged main source, HEAD d82230a, branch redesign, prior 93-file canvas stage, corrected original stage and new upload stage.
- cleanup.json records zero task-owned browsers. No local server was started.

Timing captures contain no screenshots or pixel readbacks. Dedicated functional screenshots use independent sessions after the normal sequences. The 6.8-second screen captures use wall time after the trusted START click. They are neither exact timeline samples nor fidelity comparisons. Visual inspection shows the screen and site content. Camera crop and capture-time differences prevent pixel comparison.

## Limits

This preview does not establish a reliable fix, production acceptance, physical Android performance or physical-device acceptance.
It does not establish startup causality, GPU completion, displayed-frame timing, target font equality, or actual GPU allocation.
The camera tail and panel stutters remain unresolved. Existing loading and cancellation limits remain documented in the correction package.
Atlas mip storage is estimated at 10.67 MiB versus 3.125 MiB for the original texture. Retained bitmap plus mips nominally total 18.67 MiB.
Windows font fallback can differ from Android. Prior review found slightly softer atlas edges. Hosted screenshots add functional evidence only.
Local submission timings from the prior package are not hosted or Android results. This task makes no speed claim from the hosted captures.

## Retained failed checks

permission-and-cli-notes.json records initial sandbox folder/write failures. Narrow per-command approvals succeeded. No approval refusal occurred.
The initial cleanup process query also received Access denied. Narrow approval completed the task-only query.
CLI update-worker EPIPE/timeout warnings remain in logs. Deployment and inspection nevertheless completed successfully.
No failed functional or schema check occurred in this hosted task. No main source edits, commits, push, dependency installation, account relink or project setting change occurred.
