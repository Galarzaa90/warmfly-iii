import { NextResponse } from "next/server";
import { z } from "zod";
import { createTransaction, fetchDefaultCurrency } from "../../lib/firefly";

const TransactionPayloadSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
  amount: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Amount must be a positive number.")
    .refine((value) => Number.parseFloat(value) > 0, {
      message: "Amount must be greater than zero.",
    }),
  hasForeignCurrency: z.boolean().optional(),
  foreignAmount: z.string().trim().optional(),
  foreignCurrencyCode: z.string().trim().optional(),
  description: z.string().trim().min(1),
  sourceId: z.string().trim().optional(),
  destinationId: z.string().trim().optional(),
  categoryId: z.string().trim().optional(),
  categoryName: z.string().trim().optional(),
  tags: z.array(z.string().trim()).optional(),
  notes: z.string().trim().optional(),
});

function optionalValue(value?: string) {
  return value && value.length > 0 ? value : undefined;
}

export async function POST(request: Request) {
  const parsed = TransactionPayloadSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid transaction." },
      { status: 400 },
    );
  }

  const payload = parsed.data;
  const sourceId = optionalValue(payload.sourceId);
  const destinationId = optionalValue(payload.destinationId);
  const foreignAmount = optionalValue(payload.foreignAmount);
  const foreignCurrencyCode = optionalValue(payload.foreignCurrencyCode)?.toUpperCase();

  if (!sourceId && !destinationId) {
    return NextResponse.json(
      { message: "Choose at least one inbound or outbound account." },
      { status: 400 },
    );
  }

  if (payload.hasForeignCurrency) {
    if (!foreignAmount || !/^\d+(\.\d{1,2})?$/.test(foreignAmount)) {
      return NextResponse.json(
        { message: "Enter a valid foreign amount." },
        { status: 400 },
      );
    }

    if (Number.parseFloat(foreignAmount) <= 0) {
      return NextResponse.json(
        { message: "Foreign amount must be greater than zero." },
        { status: 400 },
      );
    }

    if (!foreignCurrencyCode || !/^[A-Z]{3}$/.test(foreignCurrencyCode)) {
      return NextResponse.json(
        { message: "Enter a three-letter foreign currency code." },
        { status: 400 },
      );
    }

    const defaultCurrency = await fetchDefaultCurrency();
    if (foreignCurrencyCode === defaultCurrency.data.attributes.code) {
      return NextResponse.json(
        { message: "Foreign currency must be different from the primary currency." },
        { status: 400 },
      );
    }
  }

  try {
    const transactionType = sourceId && destinationId
      ? "transfer"
      : sourceId
        ? "withdrawal"
        : "deposit";

    const transaction = await createTransaction({
      transaction: {
        type: transactionType,
        date: `${payload.date}:00`,
        amount: payload.amount,
        description: payload.description,
        source_id: sourceId,
        destination_id: destinationId,
        category_id: optionalValue(payload.categoryId),
        category_name: optionalValue(payload.categoryName),
        foreign_amount: payload.hasForeignCurrency ? foreignAmount : undefined,
        foreign_currency_code: payload.hasForeignCurrency
          ? foreignCurrencyCode
          : undefined,
        tags: payload.tags?.filter(Boolean),
        notes: optionalValue(payload.notes),
      },
    });

    return NextResponse.json({ transaction });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create transaction.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
