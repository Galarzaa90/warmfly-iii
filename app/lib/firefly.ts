import { z } from 'zod';

const TransactionTypePropertySchema = z.enum([
  'withdrawal',
  'deposit',
  'transfer',
  'reconciliation',
  'opening balance',
]);
export type TransactionTypeProperty = z.infer<typeof TransactionTypePropertySchema>;

const TransactionSplitSchema = z.looseObject({
  amount: z.string(),
  source_id: z.string().nullable(),
  destination_id: z.string().nullable(),
  date: z.coerce.date(),
  description: z.string(),
  type: TransactionTypePropertySchema,
  foreign_amount: z.string().nullable().optional(),
  currency_code: z.string().nullable().optional(),
  currency_symbol: z.string().nullable().optional(),
  foreign_currency_symbol: z.string().nullable().optional(),
  source_name: z.string().nullable().optional(),
  destination_name: z.string().nullable().optional(),
  category_name: z.string().nullable().optional(),
  category_id: z.string().nullable().optional(),
  budget_name: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
});
export type TransactionSplit = z.infer<typeof TransactionSplitSchema>;

const TransactionSchema = z.looseObject({
  transactions: z.array(TransactionSplitSchema),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  user: z.string().optional(),
  group_title: z.string().nullable().optional(),
});
export type Transaction = z.infer<typeof TransactionSchema>;

const ObjectLinkSchema = z.looseObject({
  self: z.string().optional(),
  '0': z
    .object({
      rel: z.string().optional(),
      uri: z.string().optional(),
    })
    .optional(),
});
type ObjectLink = z.infer<typeof ObjectLinkSchema>;

const MetaSchema = z.looseObject({
  pagination: z
    .object({
      total: z.number().int().optional(),
      count: z.number().int().optional(),
      per_page: z.number().int().optional(),
      current_page: z.number().int().optional(),
      total_pages: z.number().int().optional(),
    })
    .optional(),
});
type Meta = z.infer<typeof MetaSchema>;

const PageLinkSchema = z.looseObject({
  self: z.string().optional(),
  first: z.string().optional(),
  next: z.string().nullable().optional(),
  prev: z.string().nullable().optional(),
  last: z.string().optional(),
});
type PageLink = z.infer<typeof PageLinkSchema>;

const TransactionReadSchema = z.looseObject({
  type: z.string(),
  id: z.string(),
  attributes: TransactionSchema,
  links: ObjectLinkSchema,
});
export type TransactionRead = z.infer<typeof TransactionReadSchema>;

const TransactionArraySchema = z.looseObject({
  data: z.array(TransactionReadSchema),
  meta: MetaSchema,
  links: PageLinkSchema,
});

export type TransactionArray = z.infer<typeof TransactionArraySchema>;

const InsightGroupEntrySchema = z.looseObject({
  id: z.string().optional(),
  name: z.string().optional(),
  difference: z.string().optional(),
  difference_float: z.number().optional(),
  currency_id: z.string().optional(),
  currency_code: z.string().optional(),
});
export type InsightGroupEntry = z.infer<typeof InsightGroupEntrySchema>;

const InsightGroupSchema = z.array(InsightGroupEntrySchema);
export type InsightGroup = z.infer<typeof InsightGroupSchema>;

const InsightTotalEntrySchema = z.looseObject({
  difference: z.string().optional(),
  difference_float: z.number().optional(),
  currency_id: z.string().optional(),
  currency_code: z.string().optional(),
});
export type InsightTotalEntry = z.infer<typeof InsightTotalEntrySchema>;

const InsightTotalSchema = z.array(InsightTotalEntrySchema);
export type InsightTotal = z.infer<typeof InsightTotalSchema>;

const AutoBudgetPeriodSchema = z
  .enum(['daily', 'weekly', 'monthly', 'quarterly', 'half-year', 'yearly'])
  .nullable();
type AutoBudgetPeriod = z.infer<typeof AutoBudgetPeriodSchema>;

const AutoBudgetTypeSchema = z.enum(['reset', 'rollover', 'none']).nullable();
type AutoBudgetType = z.infer<typeof AutoBudgetTypeSchema>;

const ArrayEntryWithCurrencyAndSumSchema = z.looseObject({
  currency_id: z.union([z.string(), z.number().int()]).optional(),
  currency_code: z.string().optional(),
  currency_symbol: z.string().optional(),
  currency_decimal_places: z.number().int().optional(),
  sum: z.string().optional(),
});
type ArrayEntryWithCurrencyAndSum = z.infer<typeof ArrayEntryWithCurrencyAndSumSchema>;

const BudgetPropertiesSchema = z.looseObject({
  name: z.string(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  active: z.boolean().optional(),
  order: z.number().int().optional(),
  notes: z.string().nullable().optional(),
  auto_budget_type: AutoBudgetTypeSchema.optional(),
  auto_budget_period: AutoBudgetPeriodSchema.optional(),
  object_group_id: z.string().nullable().optional(),
  object_group_order: z.number().int().nullable().optional(),
  object_group_title: z.string().nullable().optional(),
  object_has_currency_setting: z.boolean().optional(),
  currency_id: z.string().optional(),
  currency_name: z.string().optional(),
  currency_code: z.string().optional(),
  currency_symbol: z.string().optional(),
  currency_decimal_places: z.number().int().optional(),
  primary_currency_id: z.string().optional(),
  primary_currency_name: z.string().optional(),
  primary_currency_code: z.string().optional(),
  primary_currency_symbol: z.string().optional(),
  primary_currency_decimal_places: z.number().int().optional(),
  auto_budget_amount: z.string().nullable().optional(),
  pc_auto_budget_amount: z.string().nullable().optional(),
  spent: z.array(ArrayEntryWithCurrencyAndSumSchema).optional(),
  pc_spent: z.array(ArrayEntryWithCurrencyAndSumSchema).optional(),
});
export type BudgetProperties = z.infer<typeof BudgetPropertiesSchema>;

const BudgetReadSchema = z.looseObject({
  type: z.string(),
  id: z.string(),
  attributes: BudgetPropertiesSchema,
});
export type BudgetRead = z.infer<typeof BudgetReadSchema>;

const BudgetArraySchema = z.looseObject({
  data: z.array(BudgetReadSchema),
  meta: MetaSchema,
});
export type BudgetArray = z.infer<typeof BudgetArraySchema>;

const AccountPropertiesSchema = z.looseObject({
  name: z.string(),
  type: z.string(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  active: z.boolean().optional(),
  order: z.number().int().nullable().optional(),
  account_role: z.string().nullable().optional(),
  object_group_id: z.string().nullable().optional(),
  object_group_order: z.number().int().nullable().optional(),
  object_group_title: z.string().nullable().optional(),
  object_has_currency_setting: z.boolean().optional(),
  currency_id: z.string().optional(),
  currency_name: z.string().optional(),
  currency_code: z.string().optional(),
  currency_symbol: z.string().optional(),
  currency_decimal_places: z.number().int().optional(),
  primary_currency_id: z.string().optional(),
  primary_currency_name: z.string().optional(),
  primary_currency_code: z.string().optional(),
  primary_currency_symbol: z.string().optional(),
  primary_currency_decimal_places: z.number().int().optional(),
});
export type AccountProperties = z.infer<typeof AccountPropertiesSchema>;

const AccountReadSchema = z.looseObject({
  type: z.string(),
  id: z.string(),
  attributes: AccountPropertiesSchema,
});
export type AccountRead = z.infer<typeof AccountReadSchema>;

const AccountArraySchema = z.looseObject({
  data: z.array(AccountReadSchema),
  meta: MetaSchema,
});
export type AccountArray = z.infer<typeof AccountArraySchema>;

const CategoryPropertiesSchema = z.looseObject({
  name: z.string(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  notes: z.string().nullable().optional(),
  object_has_currency_setting: z.boolean().optional(),
  primary_currency_id: z.string().optional(),
  primary_currency_name: z.string().optional(),
  primary_currency_code: z.string().optional(),
  primary_currency_symbol: z.string().optional(),
  primary_currency_decimal_places: z.number().int().optional(),
  spent: z.array(ArrayEntryWithCurrencyAndSumSchema).nullable().optional(),
  pc_spent: z.array(ArrayEntryWithCurrencyAndSumSchema).nullable().optional(),
  earned: z.array(ArrayEntryWithCurrencyAndSumSchema).nullable().optional(),
  pc_earned: z.array(ArrayEntryWithCurrencyAndSumSchema).nullable().optional(),
  transferred: z.array(ArrayEntryWithCurrencyAndSumSchema).nullable().optional(),
  pc_transferred: z.array(ArrayEntryWithCurrencyAndSumSchema).nullable().optional(),
});
export type CategoryProperties = z.infer<typeof CategoryPropertiesSchema>;

const CategoryReadSchema = z.looseObject({
  type: z.string(),
  id: z.string(),
  attributes: CategoryPropertiesSchema,
});
export type CategoryRead = z.infer<typeof CategoryReadSchema>;

const CategoryArraySchema = z.looseObject({
  data: z.array(CategoryReadSchema),
  meta: MetaSchema,
});
export type CategoryArray = z.infer<typeof CategoryArraySchema>;

const TagModelSchema = z.looseObject({
  tag: z.string(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  date: z.coerce.date().nullable().optional(),
  description: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  zoom_level: z.number().int().nullable().optional(),
});
export type TagModel = z.infer<typeof TagModelSchema>;

const TagReadSchema = z.looseObject({
  type: z.string(),
  id: z.string(),
  attributes: TagModelSchema,
  links: ObjectLinkSchema,
});
export type TagRead = z.infer<typeof TagReadSchema>;

const TagArraySchema = z.looseObject({
  data: z.array(TagReadSchema),
  meta: MetaSchema,
  links: PageLinkSchema,
});
export type TagArray = z.infer<typeof TagArraySchema>;

function requireEnv(value: string | undefined, key: string) {
  if (!value) {
    throw new Error(`${key} is not set.`);
  }
  return value;
}

function cleanBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, '');
}

export async function fireflyApi<Schema extends z.ZodTypeAny>(
  path: string,
  schema: Schema,
  params?: Record<string, string | number | boolean | null | undefined>,
): Promise<z.infer<Schema>> {
  const baseUrl = cleanBaseUrl(
    requireEnv(process.env.FIREFLY_III_BASE_URL, 'FIREFLY_III_BASE_URL'),
  );
  const token = requireEnv(process.env.FIREFLY_III_API_TOKEN, 'FIREFLY_III_API_TOKEN');
  const url = new URL(`${baseUrl}${path}`);
  if (params && typeof params === 'object') {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  console.log(`[firefly] GET ${url.pathname}${url.search}`);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.api+json',
    },
    cache: 'no-store',
  });

  const payload = await response.text();

  if (!response.ok) {
    throw new Error(`Firefly API error: ${response.status} ${response.statusText}. ${payload}`);
  }

  let parsed: unknown;
  if (payload) {
    try {
      parsed = JSON.parse(payload);
    } catch (error) {
      throw new Error(
        `Failed to parse Firefly API response from ${url.toString()}: ${(error as Error).message}`,
      );
    }
  }

  return schema.parse(parsed);
}

const TransactionTypeFilterSchema = z.enum([
  'all',
  'withdrawal',
  'withdrawals',
  'expense',
  'deposit',
  'deposits',
  'income',
  'transfer',
  'transfers',
  'opening_balance',
  'reconciliation',
  'special',
  'specials',
]);
export type TransactionTypeFilter = z.infer<typeof TransactionTypeFilterSchema>;

const TransactionParamsSchema = z.object({
  limit: z.number().int().optional(),
  page: z.number().int().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  type: TransactionTypeFilterSchema.optional(),
});
export type TransactionParams = z.infer<typeof TransactionParamsSchema>;

/**
 * List all the user's transactions.
 */
export async function fetchTransactions(params: TransactionParams = {}): Promise<TransactionArray> {
  const { type } = params;
  return fireflyApi('/v1/transactions', TransactionArraySchema, {
    ...params,
    type: type === 'all' ? undefined : type,
  });
}

export async function searchTransactions({
  query,
  limit = 50,
  page = 1,
}: {
  query: string;
  limit?: number;
  page?: number;
}): Promise<TransactionArray> {
  return fireflyApi('/v1/search/transactions', TransactionArraySchema, {
    query,
    limit,
    page,
  });
}

export async function fetchBudgets({
  start,
  end,
}: {
  start: string;
  end: string;
}): Promise<BudgetArray> {
  return fireflyApi('/v1/budgets', BudgetArraySchema, {
    start,
    end,
    limit: 200,
  });
}

export async function fetchAccounts(): Promise<AccountArray> {
  return fireflyApi('/v1/accounts', AccountArraySchema, {
    limit: 200,
  });
}

export async function fetchCategories(): Promise<CategoryArray> {
  return fireflyApi('/v1/categories', CategoryArraySchema, {
    limit: 200,
  });
}

export async function fetchTags(): Promise<TagArray> {
  return fireflyApi('/v1/tags', TagArraySchema, {
    limit: 200,
  });
}

export async function fetchInsightTotals({
  type,
  start,
  end,
}: {
  type: 'expense' | 'income' | 'transfer';
  start: string;
  end: string;
}): Promise<InsightTotal> {
  return fireflyApi(`/v1/insight/${type}/total`, InsightTotalSchema, {
    start,
    end,
  });
}

export async function fetchInsightExpenseCategories({
  start,
  end,
}: {
  start: string;
  end: string;
}): Promise<InsightGroup> {
  return fireflyApi('/v1/insight/expense/category', InsightGroupSchema, {
    start,
    end,
  });
}

export async function fetchInsightExpenseNoCategory({
  start,
  end,
}: {
  start: string;
  end: string;
}): Promise<InsightTotal> {
  return fireflyApi('/v1/insight/expense/no-category', InsightTotalSchema, {
    start,
    end,
  });
}
