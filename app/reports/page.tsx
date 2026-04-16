import Link from "next/link";
import { Card, Container, Group, Stack, Text, Title } from "@mantine/core";

const MONTHS_TO_SHOW = 24;
const YEARS_TO_SHOW = 8;

function buildPastMonths(count: number) {
  const now = new Date();
  const months: { year: number; month: number; label: string }[] = [];

  for (let i = 0; i < count; i += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      label: new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
      }).format(date),
    });
  }

  return months;
}

function buildPastYears(count: number) {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: count }, (_, index) => currentYear - index);
}

function buildMonthsByYear(months: ReturnType<typeof buildPastMonths>) {
  const monthsByYear = new Map<number, { month: number; label: string }[]>();

  months.forEach((entry) => {
    const current = monthsByYear.get(entry.year) ?? [];
    current.push({ month: entry.month, label: entry.label });
    monthsByYear.set(entry.year, current);
  });

  monthsByYear.forEach((entries, year) => {
    monthsByYear.set(
      year,
      [...entries].sort((a, b) => a.month - b.month),
    );
  });

  return monthsByYear;
}

export default function ReportsPage() {
  const months = buildPastMonths(MONTHS_TO_SHOW);
  const years = buildPastYears(YEARS_TO_SHOW);
  const monthsByYear = buildMonthsByYear(months);
  const visibleYears = years.filter((year) => (monthsByYear.get(year)?.length ?? 0) > 0);

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={2}>Reports</Title>
          <Text c="dimmed" size="sm" mt={4}>
            Browse reports by year, then drill into months.
          </Text>
        </div>

        <Stack gap="sm">
          {visibleYears.map((year) => {
            const yearMonths = monthsByYear.get(year) ?? [];
            return (
              <Card
                key={year}
                padding="lg"
                radius="md"
                style={{
                  backgroundColor: "var(--app-panel-strong)",
                  border: "1px solid var(--app-border)",
                }}
              >
                <Group justify="space-between" align="center" mb="xs">
                  <Link
                    href={`/reports/${year}`}
                    style={{ color: "inherit", textDecoration: "none" }}
                  >
                    <Text fw={700} size="lg">
                      {year}
                    </Text>
                  </Link>
                  <Link
                    href={`/reports/${year}`}
                    style={{
                      color: "inherit",
                      textDecoration: "none",
                      border: "1px solid var(--app-border)",
                      background: "rgba(255,255,255,0.03)",
                      borderRadius: 999,
                      padding: "4px 10px",
                      fontSize: 13,
                      lineHeight: 1.2,
                    }}
                  >
                    Open yearly report
                  </Link>
                </Group>
                <Group gap="xs" mt="xs" wrap="wrap">
                  {yearMonths.map((entry) => (
                    <Link
                      key={`${year}-${entry.month}`}
                      href={`/reports/${year}/${entry.month}`}
                      style={{
                        color: "inherit",
                        textDecoration: "none",
                        border: "1px solid var(--app-border)",
                        background: "rgba(255,255,255,0.03)",
                        borderRadius: 999,
                        padding: "5px 12px",
                        fontSize: 14,
                        lineHeight: 1.2,
                      }}
                    >
                      <Text size="sm">
                        {new Intl.DateTimeFormat("en-US", {
                          month: "long",
                        }).format(new Date(year, entry.month - 1, 1))}
                      </Text>
                    </Link>
                  ))}
                </Group>
              </Card>
            );
          })}
        </Stack>
      </Stack>
    </Container>
  );
}
