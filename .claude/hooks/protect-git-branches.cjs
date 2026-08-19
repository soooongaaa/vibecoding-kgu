const { execFileSync } = require("node:child_process");

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
});

function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    }),
  );
}

function currentBranch() {
  try {
    return execFileSync("git", ["branch", "--show-current"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

process.stdin.on("end", () => {
  let payload;
  try {
    payload = JSON.parse(input);
  } catch {
    process.exit(0);
  }

  const command = String(payload?.tool_input?.command ?? "");
  if (!/(^|[;&|]\s*)git\s/.test(command)) {
    process.exit(0);
  }

  if (/\bgit\s+push\b[^\n]*(--force|-f\b)/i.test(command)) {
    deny("force-push는 팀 규칙상 금지되어 있습니다.");
    return;
  }

  if (/\bgit\s+(reset\s+--hard|clean\s+-[^\s]*f|branch\s+-D)\b/i.test(command)) {
    deny("작업을 잃을 수 있는 파괴적 Git 명령은 금지되어 있습니다.");
    return;
  }

  if (/\bgit\s+push\b[^\n]*(refs\/heads\/)?(main|dev)(\s|:|$)/i.test(command)) {
    deny("main 또는 dev로 직접 push할 수 없습니다. 자기 게임 브랜치에 push하고 dev 대상 PR을 만드세요.");
    return;
  }

  const branch = currentBranch();
  const protectedOperation = /\bgit\s+(commit|push|merge|rebase|cherry-pick)\b/i.test(command);
  if ((branch === "main" || branch === "dev") && protectedOperation) {
    deny(`${branch} 브랜치에서는 commit, push, merge, rebase할 수 없습니다. 배정된 feature/game-* 브랜치로 이동하세요.`);
    return;
  }

  process.exit(0);
});
