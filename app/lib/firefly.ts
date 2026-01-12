type FireflySplit = {
  amount: string;
  description: string;
  date: string;
  type?: string;
  currency_code?: string | null;
  currency_symbol?: string | null;
  source_name?: string | null;
  destination_name?: string | null;
  category_name?: string | null;
  budget_name?: string | null;
  tags?: string[] | null;
};

type FireflyTransaction = {
  id: string;
  attributes: {
    group_title?: string | null;
    transactions: FireflySplit[];
  };
};

type FireflyResponse = {
  data: FireflyTransaction[];
  meta?: {
    pagination?: {
      total?: number;
      count?: number;
      per_page?: number;
      current_page?: number;
      total_pages?: number;
    };
  };
};

type FireflyBudgetSpentEntry = {
  sum: string;
  currency_code?: string | null;
  currency_symbol?: string | null;
};

type FireflyBudget = {
  id: string;
  attributes: {
    name: string;
    currency_code?: string | null;
    currency_symbol?: string | null;
    spent?: FireflyBudgetSpentEntry[];
    auto_budget_amount?: string | null;
  };
};

type FireflyBudgetResponse = {
  data: FireflyBudget[];
};

type FireflyBudgetLimit = {
  id: string;
  attributes: {
    budget_id: string;
    amount: string;
    currency_code?: string | null;
    currency_symbol?: string | null;
    spent?: Array<{
      sum: string;
      currency_code?: string | null;
      currency_symbol?: string | null;
    }>;
  };
};

type FireflyBudgetLimitResponse = {
  data: FireflyBudgetLimit[];
};

export type ExpenseEntry = {
  id: string;
  title: string;
  date: string;
  amount: string;
  type?: string;
  currencyCode?: string | null;
  currencySymbol?: string | null;
  source?: string | null;
  destination?: string | null;
  category?: string | null;
  budget?: string | null;
  tags?: string[] | null;
};

export type BudgetLimitEntry = {
  id: string;
  budgetId: string;
  limit: number;
  spent: number;
  currencyCode?: string | null;
  currencySymbol?: string | null;
};

export type BudgetEntry = {
  id: string;
  name: string;
  spent: number;
  currencyCode?: string | null;
  currencySymbol?: string | null;
  autoLimit: number;
};

function requireEnv(value: string | undefined, key: string) {
  if (!value) {
    throw new Error(`${key} is not set.`);
  }
  return value;
}

function cleanBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, "");
}

async function fireflyFetch(path: string, params?: Record<string, string>) {
  const baseUrl = cleanBaseUrl(
    requireEnv(process.env.FIREFLY_III_BASE_URL, "FIREFLY_III_BASE_URL"),
  );
  const token = requireEnv(
    process.env.FIREFLY_III_API_TOKEN,
    "FIREFLY_III_API_TOKEN",
  );
  const url = new URL(`${baseUrl}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.api+json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Firefly API error: ${response.status} ${response.statusText}. ${text}`,
    );
  }

  return response.json();
}

export async function fetchExpenses({
  start,
  end,
  limit = 50,
  type,
}: {
  start?: string;
  end?: string;
  limit?: number;
  type?: string;
}) {
  const payload = (await fireflyFetch("/v1/transactions", {
    type: type && type !== "all" ? type : "",
    limit: String(limit),
    start: start ?? "",
    end: end ?? "",
  })) as FireflyResponse;
  const entries: ExpenseEntry[] =
    payload.data?.flatMap((item) => {
      const groupTitle = item.attributes.group_title;
      return item.attributes.transactions.map((split, index) => ({
        id: `${item.id}-${index}`,
        title: groupTitle || split.description || "Untitled expense",
        date: split.date,
        amount: split.amount,
        type: split.type,
        currencyCode: split.currency_code,
        currencySymbol: split.currency_symbol,
        source: split.source_name,
        destination: split.destination_name,
        category: split.category_name,
        budget: split.budget_name,
        tags: split.tags,
      }));
    }) ?? [];

  return {
    entries,
    pagination: payload.meta?.pagination,
  };
}

export async function fetchBudgets({
  start,
  end,
}: {
  start: string;
  end: string;
}) {
  const payload = (await fireflyFetch("/v1/budgets", {
    start,
    end,
    limit: "200",
  })) as FireflyBudgetResponse;

  return (
    payload.data?.map((budget) => {
      const spentEntry = budget.attributes.spent?.[0];
      const spentValue = Math.abs(
        Number.parseFloat(spentEntry?.sum ?? "0"),
      );
      const autoLimitValue = Math.abs(
        Number.parseFloat(budget.attributes.auto_budget_amount ?? "0"),
      );

      return {
        id: budget.id,
        name: budget.attributes.name,
        spent: Number.isNaN(spentValue) ? 0 : spentValue,
        currencyCode:
          spentEntry?.currency_code ?? budget.attributes.currency_code,
        currencySymbol:
          spentEntry?.currency_symbol ?? budget.attributes.currency_symbol,
        autoLimit: Number.isNaN(autoLimitValue) ? 0 : autoLimitValue,
      } satisfies BudgetEntry;
    }) ?? []
  );
}

export async function fetchBudgetLimits({
  start,
  end,
}: {
  start: string;
  end: string;
}) {
  const payload = (await fireflyFetch("/v1/budget-limits", {
    start,
    end,
  })) as FireflyBudgetLimitResponse;

  return (
    payload.data?.map((limit) => {
      const spentEntry = limit.attributes.spent?.[0];
      const spentValue = Math.abs(
        Number.parseFloat(spentEntry?.sum ?? "0"),
      );
      const limitValue = Math.abs(Number.parseFloat(limit.attributes.amount));

      return {
        id: limit.id,
        budgetId: limit.attributes.budget_id,
        limit: Number.isNaN(limitValue) ? 0 : limitValue,
        spent: Number.isNaN(spentValue) ? 0 : spentValue,
        currencyCode:
          spentEntry?.currency_code ?? limit.attributes.currency_code,
        currencySymbol:
          spentEntry?.currency_symbol ?? limit.attributes.currency_symbol,
      } satisfies BudgetLimitEntry;
    }) ?? []
  );
}
