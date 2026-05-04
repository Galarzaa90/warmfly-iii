import { NextResponse } from "next/server";
import { fetchTransactionDescriptionAutocomplete } from "../../../lib/firefly";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const suggestions = await fetchTransactionDescriptionAutocomplete(query);
    return NextResponse.json({ suggestions });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load transaction suggestions.";
    return NextResponse.json({ message, suggestions: [] }, { status: 500 });
  }
}
