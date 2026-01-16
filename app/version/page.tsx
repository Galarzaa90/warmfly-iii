import { Container, Stack, Text, Title } from "@mantine/core";
import { getBuildInfo } from "../lib/build-info";
import VersionDetails from "./version-details";

export const metadata = {
  title: "Version | Warmfly III",
};

function cleanValue(value?: string | null) {
  if (!value) return "unknown";
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "unknown";
}

const buildInfo = getBuildInfo();
const commitHash = cleanValue(buildInfo.commitHash);
const buildVersion = cleanValue(buildInfo.buildVersion);
const buildDate = cleanValue(buildInfo.buildDate);

function formatCommit(value: string) {
  if (value === "unknown") return value;
  return value.length > 12 ? value.slice(0, 12) : value;
}

function formatBuildDate(value: string) {
  if (value === "unknown") return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function formatUptime() {
  const totalSeconds = Math.max(0, Math.floor(process.uptime()));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  if (minutes > 0) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }
  return `${seconds}s`;
}

export default function VersionPage() {
  return (
    <Container size={720} py={48}>
      <Stack gap={20}>
        <Title order={1}>Version</Title>
        <Text c="dimmed">
          Deployment metadata for this instance of Warmfly III.
        </Text>
        <VersionDetails
          commitHash={commitHash}
          commitShort={formatCommit(commitHash)}
          buildVersion={buildVersion}
          buildDateLocal={formatBuildDate(buildDate)}
          uptime={formatUptime()}
        />
      </Stack>
    </Container>
  );
}
