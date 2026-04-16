import { notFound } from "next/navigation";
import ReportView from "../ReportView";
import { yearEndDate, yearStartDate } from "../../lib/reports";

type Params = {
  year: string;
};

function parseYear(value: string) {
  const year = Number.parseInt(value, 10);
  if (Number.isNaN(year) || year < 1970 || year > 9999) return null;
  return year;
}

export default async function YearlyReportPage({
  params,
}: {
  params: Params | Promise<Params>;
}) {
  const resolvedParams = await Promise.resolve(params);
  const year = parseYear(resolvedParams.year);
  if (!year) notFound();

  return (
    <ReportView
      title={`${year} Report`}
      startDate={yearStartDate(year)}
      endDate={yearEndDate(year)}
      cacheSeconds={30 * 60}
      breadcrumbs={[
        { label: "Reports", href: "/reports" },
        { label: String(year) },
      ]}
    />
  );
}
