"use client";

import { Card, Group, Stack, Text } from "@mantine/core";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type PieDatum = {
  name: string;
  value: number;
};

type Props = {
  title: string;
  data: PieDatum[];
  currencyCode?: string | null;
  emptyLabel: string;
};

const CHART_COLORS = [
  "#22c55e",
  "#ef4444",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#eab308",
  "#14b8a6",
  "#ec4899",
  "#f97316",
  "#6366f1",
];

function formatAmount(amount: number, currencyCode?: string | null) {
  if (currencyCode) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  return amount.toFixed(2);
}

export default function ReportPieCard({
  title,
  data,
  currencyCode,
  emptyLabel,
}: Props) {
  const total = data.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <Card
      padding="lg"
      radius="md"
      style={{
        backgroundColor: "var(--app-panel)",
        border: "1px solid var(--app-border)",
      }}
    >
      <Text fw={600}>{title}</Text>
      {data.length === 0 ? (
        <Text size="sm" c="dimmed">
          {emptyLabel}
        </Text>
      ) : (
        <Stack gap="md" mt="md">
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 12, right: 12, bottom: 12, left: 12 }}>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius="88%"
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`${entry.name}-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => {
                    const numericValue = Array.isArray(value)
                      ? Number(value[0] ?? 0)
                      : Number(value ?? 0);

                    return formatAmount(
                      Number.isFinite(numericValue) ? numericValue : 0,
                      currencyCode,
                    );
                  }}
                  contentStyle={{
                    backgroundColor: "var(--app-panel-strong)",
                    border: "1px solid var(--app-border)",
                    borderRadius: "12px",
                  }}
                  itemStyle={{ color: "var(--mantine-color-text)" }}
                  labelStyle={{ color: "var(--mantine-color-text)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <Stack gap={8}>
            {data.map((entry, index) => {
              const color = CHART_COLORS[index % CHART_COLORS.length];
              const percentage = total > 0 ? Math.round((entry.value / total) * 100) : 0;

              return (
                <Group key={`${entry.name}-${index}`} justify="space-between" align="center">
                  <Group gap="xs" wrap="nowrap">
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        minWidth: 10,
                        borderRadius: "50%",
                        backgroundColor: color,
                        display: "inline-block",
                      }}
                    />
                    <Text size="sm">
                      {entry.name} ({percentage}%)
                    </Text>
                  </Group>
                  <Text size="sm" ta="right">
                    {formatAmount(entry.value, currencyCode)}
                  </Text>
                </Group>
              );
            })}
          </Stack>
        </Stack>
      )}
    </Card>
  );
}
