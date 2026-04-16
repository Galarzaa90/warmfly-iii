import { notFound } from "next/navigation";
import ReportView from "../../ReportView";
import { monthEndDate, monthStartDate } from "../../../lib/reports";

type Params = {
  year: string;
  month: string;
};

function parseYearAndMonth(params: Params) {
  const year = Number.parseInt(params.year, 10);
  const month = Number.parseInt(params.month, 10);

  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    year < 1970 ||
    year > 9999 ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }

  return { year, month };
}

export default async function MonthlyReportPage({
  params,
}: {
  params: Params | Promise<Params>;
}) {
  const resolvedParams = await Promise.resolve(params);
  const parsed = parseYearAndMonth(resolvedParams);
  if (!parsed) notFound();

  const { year, month } = parsed;
  const startDate = monthStartDate(year, month);
  const endDate = monthEndDate(year, month);
  const monthLabel = new Intl.DateTimeFormat("en-US", { month: "long" }).format(
    startDate,
  );

  return (
    <ReportView
      title={`${monthLabel} ${year}`}
      startDate={startDate}
      endDate={endDate}
      cacheSeconds={60}
      breadcrumbs={[
        { label: "Reports", href: "/reports" },
        { label: String(year), href: `/reports/${year}` },
        { label: monthLabel },
      ]}
    />
  );
}
