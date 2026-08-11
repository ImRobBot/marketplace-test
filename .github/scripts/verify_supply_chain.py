from __future__ import annotations

import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SHA_REF = re.compile(r"^[0-9a-f]{40}$")
USES = re.compile(r"^\s*uses:\s*([^\s#]+)", re.MULTILINE)
USER = re.compile(r"^\s*USER\s+(\S+)", re.IGNORECASE | re.MULTILINE)


def relative(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def verify_action_pins(violations: list[str]) -> None:
    workflows = sorted((ROOT / ".github" / "workflows").glob("*.y*ml"))
    for workflow in workflows:
        content = workflow.read_text(encoding="utf-8")
        for match in USES.finditer(content):
            action = match.group(1)
            if action.startswith("./"):
                continue
            if "@" not in action or not SHA_REF.fullmatch(action.rsplit("@", 1)[1]):
                violations.append(
                    f"{relative(workflow)} uses a mutable action reference: {action}"
                )


def verify_install_script_gate(violations: list[str]) -> None:
    candidates = [
        *sorted((ROOT / ".github" / "workflows").glob("*.y*ml")),
        *sorted(ROOT.glob("*/Dockerfile")),
    ]
    for path in candidates:
        for line_number, line in enumerate(
            path.read_text(encoding="utf-8").splitlines(), start=1
        ):
            if "pnpm install" in line and "--ignore-scripts" not in line:
                violations.append(
                    f"{relative(path)}:{line_number} must block dependency scripts"
                )


def verify_runtime_users(violations: list[str]) -> None:
    for dockerfile in sorted(ROOT.glob("*/Dockerfile")):
        content = dockerfile.read_text(encoding="utf-8")
        stages = re.split(r"(?=^FROM\s+)", content, flags=re.IGNORECASE | re.MULTILINE)
        final_stage = next((stage for stage in reversed(stages) if stage.strip()), "")
        users = USER.findall(final_stage)
        if not users or users[-1].lower() in {"0", "root"}:
            violations.append(
                f"{relative(dockerfile)} final stage must run as a non-root user"
            )


def verify_pnpm_version(violations: list[str]) -> None:
    expected = "pnpm@11.21.0"
    for manifest in (ROOT / "backend" / "package.json", ROOT / "frontend" / "package.json"):
        package = json.loads(manifest.read_text(encoding="utf-8"))
        if package.get("packageManager") != expected:
            violations.append(f"{relative(manifest)} must pin packageManager to {expected}")

    for dockerfile in sorted(ROOT.glob("*/Dockerfile")):
        content = dockerfile.read_text(encoding="utf-8")
        if "corepack prepare pnpm@11.21.0 --activate" not in content:
            violations.append(f"{relative(dockerfile)} must pin pnpm 11.21.0")

    workflow = (ROOT / ".github" / "workflows" / "ci.yml").read_text(
        encoding="utf-8"
    )
    if workflow.count("version: 11.21.0") != 2:
        violations.append("ci.yml must pin both pnpm setup steps to 11.21.0")


def main() -> int:
    violations: list[str] = []
    verify_action_pins(violations)
    verify_install_script_gate(violations)
    verify_runtime_users(violations)
    verify_pnpm_version(violations)

    if violations:
        print("Supply-chain policy violations:")
        for violation in violations:
            print(f"- {violation}")
        return 1

    print("Supply-chain policy verified.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
