import { ActionIcon, Box, Container, Group, Text } from "@mantine/core";
import {
  IconBrandGithub,
  IconBrandGitlab,
  IconWorld,
} from "@tabler/icons-react";

export default function Footer() {
  return <Box
    component="footer"
      style={{
        borderTop: "1px solid var(--app-border)",
        background: "rgba(6, 8, 15, 0.6)",
        backdropFilter: "blur(12px)",
        marginTop: 40,
      }}
    >
    <Container
      size={1200}
      px={24}
      py={16}
      >
      <Group justify="space-between" gap={16} wrap="wrap">
        <Text size="sm">© {new Date().getFullYear()} Allan Galarza</Text>
        <Group gap={14}>
          <ActionIcon
            component="a"
            href="https://github.com/Galarzaa90"
            target="_blank"
            rel="noreferrer"
            variant="subtle"
            size="sm"
            style={{ color: "inherit" }}
            aria-label="GitHub"
            title="GitHub"
          >
            <IconBrandGithub size={18} aria-hidden="true" />
          </ActionIcon>
          <ActionIcon
            component="a"
            href="https://gitlab.com/Galarzaa90"
            target="_blank"
            rel="noreferrer"
            variant="subtle"
            size="sm"
            style={{ color: "inherit" }}
            aria-label="GitLab"
            title="GitLab"
          >
            <IconBrandGitlab size={18} aria-hidden="true" />
          </ActionIcon>
          <ActionIcon
            component="a"
            href="https://galarzaa.com"
            target="_blank"
            rel="noreferrer"
            variant="subtle"
            size="sm"
            style={{ color: "inherit" }}
            aria-label="galarzaa.com"
            title="galarzaa.com"
          >
            <IconWorld size={18} aria-hidden="true" />
          </ActionIcon>
        </Group>
      </Group>
    </Container>
  </Box>
}