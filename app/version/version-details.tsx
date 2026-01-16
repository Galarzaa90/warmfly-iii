"use client";

import {
  Button,
  Code,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { CopyButton } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";

type Props = {
  commitHash: string;
  commitShort: string;
  buildVersion: string;
  buildDateLocal: string;
  serverStartMs: number;
};

export default function VersionDetails({
  commitHash,
  commitShort,
  buildVersion,
  buildDateLocal,
  serverStartMs,
}: Props) {
  const canCopy = commitHash !== "unknown";
  const [now, setNow] = useState(() => Date.now());

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
      <Paper withBorder radius="md" p="lg" style={{ borderColor: "var(--app-border)" }}>
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
      </Paper>
      <Paper withBorder radius="md" p="lg" style={{ borderColor: "var(--app-border)" }}>
        <Stack gap={8}>
          <Text size="sm" c="dimmed">
            Build version
          </Text>
          <Code>{buildVersion}</Code>
        </Stack>
      </Paper>
      <Paper withBorder radius="md" p="lg" style={{ borderColor: "var(--app-border)" }}>
        <Stack gap={8}>
          <Text size="sm" c="dimmed">
            Build date
          </Text>
          <Code>{buildDateLocal}</Code>
        </Stack>
      </Paper>
      <Paper withBorder radius="md" p="lg" style={{ borderColor: "var(--app-border)" }}>
        <Stack gap={8}>
          <Text size="sm" c="dimmed">
            Uptime
          </Text>
          <Title order={4}>{uptime}</Title>
        </Stack>
      </Paper>
    </SimpleGrid>
  );
}
