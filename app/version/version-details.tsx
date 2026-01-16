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

type Props = {
  commitHash: string;
  commitShort: string;
  buildVersion: string;
  buildDateLocal: string;
  uptime: string;
};

export default function VersionDetails({
  commitHash,
  commitShort,
  buildVersion,
  buildDateLocal,
  uptime,
}: Props) {
  const canCopy = commitHash !== "unknown";

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
