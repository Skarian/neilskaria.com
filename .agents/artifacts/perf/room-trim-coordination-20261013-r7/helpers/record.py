"""room-trim r7 coordination append with bounded r13-style before/after protection checks."""
import datetime, hashlib, json, os, subprocess, sys

ROOT = r"C:\projects\neilskaria.com"
OWN = os.path.join(ROOT, r".agents\artifacts\perf\room-trim-coordination-20261013-r7")
COORD = os.path.join(ROOT, r".agents\coordination.md")
COORD_REL = ".agents/coordination.md"
MANIFEST_REL = ".agents/artifacts/perf/clean-gpu-atlas-preview-preparation-20261013/upload-manifest.json"
EXPECT_PREFIX = (240605, "988d1479b7280c330fb4d5fce6119180175cf70ec91fcaa45b51d67a75349a55")


def sha(b):
    return hashlib.sha256(b).hexdigest()


def fsha(path):
    try:
        with open(path, "rb") as f:
            return sha(f.read())
    except FileNotFoundError:
        return "MISSING"


def git(*args, check=True):
    r = subprocess.run(["git", "--no-optional-locks", "-C", ROOT, *args], capture_output=True)
    if check and r.returncode != 0:
        sys.exit(f"git {args} failed: {r.stderr!r}")
    return r


def snapshot():
    manifest = os.path.join(ROOT, MANIFEST_REL)
    with open(manifest, "rb") as f:
        paths = sorted(e["path"] for e in json.loads(f.read())["files"])
    src = "".join(f"{p}\0{fsha(os.path.join(ROOT, p))}\n" for p in paths).encode()
    gitdir = git("rev-parse", "--absolute-git-dir").stdout.decode().strip()
    return {
        "source_manifest_paths": len(paths),
        "source_sha256": sha(src),
        "index_sha256": fsha(os.path.join(gitdir, "index")),
        "refs_sha256": sha(git("show-ref", "--head").stdout),
        "HEAD_sha256": fsha(os.path.join(gitdir, "HEAD")),
        "branch": git("rev-parse", "--abbrev-ref", "HEAD").stdout.decode().strip(),
        "branch_HEAD": git("rev-parse", "HEAD").stdout.decode().strip(),
        "gitignore_sha256": fsha(os.path.join(ROOT, ".gitignore")),
        "exclude_sha256": fsha(os.path.join(gitdir, "info", "exclude")),
        "excludes_config_sha256": sha(git("config", "--get", "core.excludesFile", check=False).stdout),
        "tracked_status_sha256": sha(git("status", "--porcelain", "--untracked-files=no").stdout),
        "coordination_excluded": git("check-ignore", "-q", COORD_REL, check=False).returncode == 0,
        "coordination_absent_from_index": git("ls-files", "--", COORD_REL).stdout.strip() == b"",
        "manifest_sha256": fsha(manifest),
    }


before = snapshot()
with open(COORD, "rb") as f:
    prefix = f.read()
if (len(prefix), sha(prefix)) != EXPECT_PREFIX:
    sys.exit(f"prefix mismatch: {len(prefix)} {sha(prefix)}")
with open(os.path.join(OWN, "helpers", "append.md"), "rb") as f:
    append = f.read()
if b"\r\n" in prefix[-4000:] and b"\r\n" not in append:
    append = append.replace(b"\n", b"\r\n")

with open(COORD, "ab") as f:
    f.write(append)

with open(COORD, "rb") as f:
    result = f.read()
after = snapshot()
ok = result[: len(prefix)] == prefix and result[len(prefix):] == append and len(result) == len(prefix) + len(append)

out = {
    "schema": 1,
    "recorded_at_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "manifest_path": MANIFEST_REL,
    "manifest_sha256": after["manifest_sha256"],
    "prefix": {"bytes": len(prefix), "sha256": sha(prefix), "preserved": result[: len(prefix)] == prefix},
    "append": {"bytes": len(append), "sha256": sha(append),
               "exact_length": len(result) == len(prefix) + len(append),
               "exact_bytes": result[len(prefix):] == append},
    "result": {"bytes": len(result), "sha256": sha(result)},
    "source_index_refs_HEAD_before": before,
    "source_index_refs_HEAD_after": after,
    "protected_unchanged": before == after,
    "coordination_excluded": after["coordination_excluded"],
    "coordination_absent_from_index": after["coordination_absent_from_index"],
    "uncommitted_state": "Tracked status, index and refs preserved; ignored coordination absent from index. No commit or Git mutation.",
    "verification_method": "Bounded r6 protected-prefix method (r13-derived): hash only the 94 manifest paths in the main checkout, index, show-ref --head output, HEAD, root ignore/exclude and manifest; check coordination ignore/index absence; hash tracked porcelain status and excludes config. Missing source paths use MISSING. No full ref dump. Prefix checked against r6 result bytes/sha (240605, 988d1479...) before append; this preserves all earlier records, including the r13, root deployment and room-trim r1-r6 records. Git reads use --no-optional-locks. Source/refs digests use this run's serialization and are compared before/after within this run only.",
    "helpers_retained": ["helpers/append.md", "helpers/record.py"],
    "scope": "Only append to coordination.md and NEW owned verification/verification.json (plus retained own helpers). No source changes, browser, build, tests, Git mutation, account changes, deployment, workaround or children.",
    "model": "claude-opus-5-5",
}
with open(os.path.join(OWN, "verification", "verification.json"), "w", encoding="utf-8", newline="\n") as f:
    json.dump(out, f, indent=2)
    f.write("\n")
print(json.dumps({"ok": ok, "protected_unchanged": before == after, "prefix": out["prefix"], "append": out["append"], "result": out["result"],
                  "excluded": after["coordination_excluded"], "absent": after["coordination_absent_from_index"], "branch_HEAD": after["branch_HEAD"]}, indent=1))
