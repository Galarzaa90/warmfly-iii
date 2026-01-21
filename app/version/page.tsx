import { Container, Stack, Title } from "@mantine/core";
import { getBuildInfo } from "../lib/build-info";
import VersionDetails from "./VersionDetails";

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
const serverStartMs = Date.now() - Math.floor(process.uptime() * 1000);

export default function VersionPage() {
  return (
    <Container size={720} py={48}>
      <Stack gap={20}>
        <Title order={1}>Version Info</Title>
        <VersionDetails
          commitHash={commitHash}
          buildVersion={buildVersion}
          buildDate={buildDate}
          serverStartMs={serverStartMs}
        />
      </Stack>
    </Container>
  );
}
