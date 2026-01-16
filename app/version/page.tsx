import { Container, Stack, Text, Title } from "@mantine/core";
import { getBuildInfo } from "../lib/build-info";
import VersionDetails from "./version-details";

export const metadata = {
  title: "Version | Warmfly III",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  const hasTimezone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(value);
  const normalized = hasTimezone ? value : `${value}Z`;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

export default function VersionPage() {
  const serverStartMs = Date.now() - Math.floor(process.uptime() * 1000);

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
          serverStartMs={serverStartMs}
        />
      </Stack>
    </Container>
  );
}
