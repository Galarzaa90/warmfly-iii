import "server-only";
import { execSync } from "node:child_process";

export interface BuildInfo {
  commitHash: string;
  buildVersion: string;
  buildDate: string;
  source: {
    commitHash: "env" | "git" | "fallback";
    buildVersion: "env" | "package" | "git" | "fallback";
    buildDate: "env" | "git" | "fallback";
  };
}

function readEnv(key: string): string | undefined {
  const value = process.env[key];
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return undefined;
}

function tryExec(command: string): string | undefined {
  try {
    return execSync(command, { encoding: "utf8" }).trim();
  } catch {
    return undefined;
  }
}

let cachedInfo: BuildInfo | undefined;

export function getBuildInfo(): BuildInfo {
  if (cachedInfo) {
    return cachedInfo;
  }

  const commitFromEnv =
    readEnv("COMMIT_SHA") ??
    readEnv("BUILD_REF") ??
    readEnv("NEXT_PUBLIC_BUILD_REF") ??
    readEnv("VERCEL_GIT_COMMIT_SHA") ??
    readEnv("GITHUB_SHA");
  const commitFromGit = commitFromEnv ? undefined : tryExec("git rev-parse HEAD");

  const versionFromEnv =
    readEnv("BUILD_VERSION") ??
    readEnv("NEXT_PUBLIC_BUILD_VERSION") ??
    readEnv("npm_package_version");
  const versionFromGit = versionFromEnv
    ? undefined
    : tryExec("git describe --tags --always");

  const dateFromEnv =
    readEnv("BUILD_DATE") ??
    readEnv("BUILD_TIME") ??
    readEnv("NEXT_PUBLIC_BUILD_DATE");
  const dateFromGit = dateFromEnv
    ? undefined
    : tryExec("git show -s --format=%cI HEAD");

  const commitHash = commitFromEnv ?? commitFromGit ?? "unknown";
  const buildVersion = versionFromEnv ?? versionFromGit ?? "unknown";
  const buildDate = dateFromEnv ?? dateFromGit ?? new Date().toISOString();

  cachedInfo = {
    commitHash,
    buildVersion,
    buildDate,
    source: {
      commitHash: commitFromEnv ? "env" : commitFromGit ? "git" : "fallback",
      buildVersion: versionFromEnv
        ? versionFromEnv === process.env.npm_package_version
          ? "package"
          : "env"
        : versionFromGit
          ? "git"
          : "fallback",
      buildDate: dateFromEnv ? "env" : dateFromGit ? "git" : "fallback",
    },
  };

  return cachedInfo;
}
