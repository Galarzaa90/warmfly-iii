import Link from "next/link";
import { Card, Container, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { fetchCategories } from "../lib/firefly";

export const dynamic = "force-dynamic";

export default async function CategoriesLandingPage() {
  const response = await fetchCategories();
  const categories = (response.data ?? []).sort((a, b) =>
    a.attributes.name.localeCompare(b.attributes.name),
  );

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={2}>Categories</Title>
          <Text c="dimmed" size="sm" mt={4}>
            Pick a category to open its report.
          </Text>
        </div>

        <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="sm">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.id}`}
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
                  {category.attributes.name}
                </Text>
              </Card>
            </Link>
          ))}
        </SimpleGrid>
      </Stack>
    </Container>
  );
}
