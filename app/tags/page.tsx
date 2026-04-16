import Link from "next/link";
import { Card, Container, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { fetchTags } from "../lib/firefly";

export default async function TagsLandingPage() {
  const response = await fetchTags();
  const tags = (response.data ?? [])
    .map((tag) => tag.attributes.tag)
    .filter((tag): tag is string => Boolean(tag))
    .sort((a, b) => a.localeCompare(b));

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={2}>Tags</Title>
          <Text c="dimmed" size="sm" mt={4}>
            Pick a tag to open its report.
          </Text>
        </div>

        <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="sm">
          {tags.map((tag) => (
            <Link
              key={tag}
              href={`/tags/${encodeURIComponent(tag)}`}
              style={{ color: "inherit", textDecoration: "none", display: "block" }}
            >
              <Card
                padding="md"
                radius="md"
                style={{
                  backgroundColor: "var(--app-panel-strong)",
                  border: "1px solid var(--app-border)",
                }}
              >
                <Text fw={600} size="sm" truncate="end">
                  {tag}
                </Text>
              </Card>
            </Link>
          ))}
        </SimpleGrid>
      </Stack>
    </Container>
  );
}
