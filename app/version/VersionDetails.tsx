"use client";

import {
  Button,
  Card,
  Code,
  CopyButton,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useEffect, useMemo, useState } from "react";

type VersionDetailsProps = {
  commitHash: string;
  buildVersion: string;
  buildDate: string;
  serverStartMs: number;
};

function formatCommit(value: string) {
  if (value === "unknown") return value;
  return value.length > 12 ? value.slice(0, 12) : value;
}

export default function VersionDetails({
  commitHash,
  buildVersion,
  buildDate,
  serverStartMs,
}: VersionDetailsProps) {
  const canCopy = commitHash !== "unknown";
  const [now, setNow] = useState(() => Date.now());
  const commitShort = formatCommit(commitHash);
  const buildDateLocal = useMemo(() => {
    if (buildDate === "unknown") return buildDate;
    const hasTimezone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(buildDate);
    const normalized = hasTimezone ? buildDate : `${buildDate}Z`;
    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) return buildDate;
    return parsed.toLocaleString();
  }, [buildDate]);

  useEffect(() => {
    const handle = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(handle);
  }, []);

  const uptime = useMemo(() => {
    const totalSeconds = Math.max(0, Math.floor((now - serverStartMs) / 1000));
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
  }, [now, serverStartMs]);

  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
      <Card withBorder radius="md" p="lg" style={{ borderColor: "var(--app-border)" }}>
        <Stack gap={8}>
          <Text size="sm" c="dimmed">
            Commit hash
          </Text>
          <Group gap="xs">
            <Code>{commitShort}</Code>
            <CopyButton value={commitHash}>
              {({ copied, copy }) => (
                <Button
                  size="xs"
                  variant="light"
                  onClick={copy}
                  disabled={!canCopy}
                >
                  {copied ? "Copied" : "Copy"}
                </Button>
              )}
            </CopyButton>
          </Group>
        </Stack>
      </Card>
      <Card withBorder radius="md" p="lg" style={{ borderColor: "var(--app-border)" }}>
        <Stack gap={8}>
          <Text size="sm" c="dimmed">
            Build version
          </Text>
          <Title order={4}>{buildVersion}</Title>
        </Stack>
      </Card>
      <Card withBorder radius="md" p="lg" style={{ borderColor: "var(--app-border)" }}>
        <Stack gap={8}>
          <Text size="sm" c="dimmed">
            Build date
          </Text>
          <Title order={4}>{buildDateLocal}</Title>
        </Stack>
      </Card>
      <Card withBorder radius="md" p="lg" style={{ borderColor: "var(--app-border)" }}>
        <Stack gap={8}>
          <Text size="sm" c="dimmed">
            Uptime
          </Text>
          <Title order={4}>{uptime}</Title>
        </Stack>
      </Card>
    </SimpleGrid>
  );
}
