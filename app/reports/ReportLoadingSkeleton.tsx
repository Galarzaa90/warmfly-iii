import {
  Card,
  Container,
  Group,
  SimpleGrid,
  Skeleton,
  Stack,
} from "@mantine/core";

type Props = {
  breadcrumbItems?: number;
};

export default function ReportLoadingSkeleton({ breadcrumbItems = 2 }: Props) {
  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Stack gap={8}>
          <Group gap={8} wrap="nowrap">
            {Array.from({ length: breadcrumbItems }).map((_, index) => (
              <Group key={`crumb-${index}`} gap={8} wrap="nowrap">
                <Skeleton height={12} width={index === 0 ? 56 : 72} />
                {index < breadcrumbItems - 1 ? <Skeleton height={10} width={8} /> : null}
              </Group>
            ))}
          </Group>
          <Skeleton height={30} width={220} />
          <Skeleton height={14} width={240} />
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }}>
          {Array.from({ length: 5 }).map((_, index) => (
            <Card
              key={`summary-${index}`}
              padding="lg"
              radius="md"
              style={{
                backgroundColor: "var(--app-panel)",
                border: "1px solid var(--app-border)",
              }}
            >
              <Skeleton height={12} width="45%" mb="md" />
              <Skeleton height={28} width="80%" />
              <Skeleton height={10} width="60%" mt="md" />
            </Card>
          ))}
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, lg: 2 }}>
          {Array.from({ length: 2 }).map((_, index) => (
            <Card
              key={`credit-pie-${index}`}
              padding="lg"
              radius="md"
              style={{
                backgroundColor: "var(--app-panel)",
                border: "1px solid var(--app-border)",
              }}
            >
              <Skeleton height={16} width="55%" mb="md" />
              <Skeleton height={280} radius="md" />
            </Card>
          ))}
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, lg: 2 }}>
          {Array.from({ length: 2 }).map((_, index) => (
            <Card
              key={`category-pie-${index}`}
              padding="lg"
              radius="md"
              style={{
                backgroundColor: "var(--app-panel)",
                border: "1px solid var(--app-border)",
              }}
            >
              <Skeleton height={16} width="60%" mb="md" />
              <Skeleton height={280} radius="md" />
            </Card>
          ))}
        </SimpleGrid>

        <Card
          padding="lg"
          radius="md"
          style={{
            backgroundColor: "var(--app-panel-strong)",
            border: "1px solid var(--app-border)",
          }}
        >
          <Group justify="space-between" mb="md">
            <Skeleton height={16} width={140} />
            <Skeleton height={20} width={90} radius="xl" />
          </Group>
          <Stack gap="sm">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={`row-${index}`} height={16} />
            ))}
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}

