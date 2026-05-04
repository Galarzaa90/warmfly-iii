"use client";

import {
  ActionIcon,
  Alert,
  Autocomplete,
  Button,
  Group,
  Loader,
  Modal,
  NumberInput,
  Select,
  Stack,
  Switch,
  TagsInput,
  Text,
  TextInput,
  Textarea,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconAlertCircle,
  IconArrowDown,
  IconArrowUp,
  IconArrowsRightLeft,
  IconDeviceFloppy,
  IconPlus,
  IconX,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

type Option = { value: string; label: string };
type ResultingType = "withdrawal" | "deposit" | "transfer" | null;
type PrimaryCurrency = { code: string; name: string; symbol?: string } | null;

type Props = {
  accountOptions: Option[];
  categoryOptions: Option[];
  labelOptions: Option[];
  currencyOptions: Option[];
  primaryCurrency: PrimaryCurrency;
};

function localDateTime(date = new Date()) {
  const pad = (value: number) => value.toString().padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-") + `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function initialValues() {
  return {
    date: localDateTime(),
    amount: "",
    hasForeignCurrency: false,
    foreignAmount: "",
    foreignCurrencyCode: "",
    description: "",
    sourceId: "",
    destinationId: "",
    categoryName: "",
    tags: [] as string[],
    notes: "",
  };
}

function inferType({
  sourceId,
  destinationId,
}: {
  sourceId: string;
  destinationId: string;
}): ResultingType {
  if (sourceId && destinationId) return "transfer";
  if (sourceId) return "withdrawal";
  if (destinationId) return "deposit";
  return null;
}

function formatResultingType(type: ResultingType) {
  if (type === "transfer") return "Transaction";
  if (type === "withdrawal") return "Withdraw";
  if (type === "deposit") return "Deposit";
  return "Choose an account";
}

function ResultingTypeIcon({ type }: { type: Exclude<ResultingType, null> }) {
  if (type === "withdrawal") {
    return <IconArrowDown size={18} color="#f97316" aria-hidden="true" />;
  }
  if (type === "deposit") {
    return <IconArrowUp size={18} color="#22c55e" aria-hidden="true" />;
  }
  return <IconArrowsRightLeft size={18} color="#38bdf8" aria-hidden="true" />;
}

export default function AddTransactionButton({
  accountOptions,
  categoryOptions,
  labelOptions,
  currencyOptions,
  primaryCurrency,
}: Props) {
  const router = useRouter();
  const [opened, { open, close }] = useDisclosure(false);
  const [values, setValues] = useState(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [descriptionSuggestions, setDescriptionSuggestions] = useState<string[]>([]);
  const [isLoadingDescriptions, setIsLoadingDescriptions] = useState(false);
  const resultingType = inferType(values);

  useEffect(() => {
    const query = values.description.trim();
    const controller = new AbortController();

    if (query.length < 2) {
      const resetTimeout = window.setTimeout(() => {
        setDescriptionSuggestions([]);
        setIsLoadingDescriptions(false);
      }, 0);
      return () => {
        window.clearTimeout(resetTimeout);
        controller.abort();
      };
    }

    const timeout = window.setTimeout(async () => {
      setIsLoadingDescriptions(true);
      try {
        const response = await fetch(
          `/api/autocomplete/transactions?query=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        const payload = (await response.json().catch(() => null)) as
          | { suggestions?: string[] }
          | null;
        if (!controller.signal.aborted) {
          setDescriptionSuggestions(payload?.suggestions ?? []);
        }
      } catch {
        if (!controller.signal.aborted) {
          setDescriptionSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingDescriptions(false);
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [values.description]);

  const resetAndClose = () => {
    setValues(initialValues());
    setErrorMessage(null);
    close();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const response = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;

    if (!response.ok) {
      setErrorMessage(payload?.message ?? "Unable to create transaction.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    resetAndClose();
    router.refresh();
  };

  return (
    <>
      <Tooltip label="Add transaction" position="left">
        <ActionIcon
          aria-label="Add transaction"
          size={64}
          radius={64}
          color="teal"
          variant="filled"
          onClick={open}
          style={{
            position: "fixed",
            right: 24,
            bottom: 24,
            zIndex: 20,
            boxShadow: "0 18px 38px rgba(0, 0, 0, 0.38)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
          }}
        >
          <IconPlus size={32} stroke={2.4} />
        </ActionIcon>
      </Tooltip>

      <Modal
        opened={opened}
        onClose={resetAndClose}
        title="Add transaction"
        centered
        size="lg"
        overlayProps={{ backgroundOpacity: 0.65, blur: 6 }}
      >
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            {errorMessage ? (
              <Alert color="red" icon={<IconAlertCircle size={18} />}>
                {errorMessage}
              </Alert>
            ) : null}

            <Group grow align="flex-start">
              <TextInput
                label="Date and time"
                type="datetime-local"
                value={values.date}
                required
                onChange={(event) => {
                  const date = event.currentTarget.value;
                  setValues((current) => ({ ...current, date }));
                }}
              />
              <NumberInput
                label="Amount"
                rightSectionWidth={56}
                rightSection={
                  primaryCurrency ? (
                    <Text size="xs" c="dimmed" fw={600}>
                      {primaryCurrency.code}
                    </Text>
                  ) : null
                }
                styles={{
                  input: {
                    paddingRight: primaryCurrency ? 56 : undefined,
                  },
                }}
                value={values.amount}
                required
                min={0.01}
                decimalScale={2}
                fixedDecimalScale
                allowNegative={false}
                onChange={(nextValue) =>
                  setValues((current) => ({ ...current, amount: String(nextValue || "") }))
                }
              />
            </Group>

            <Switch
              label="Foreign currency"
              checked={values.hasForeignCurrency}
              onChange={(event) => {
                const hasForeignCurrency = event.currentTarget.checked;
                setValues((current) => ({
                  ...current,
                  hasForeignCurrency,
                  foreignAmount: hasForeignCurrency ? current.foreignAmount : "",
                  foreignCurrencyCode: hasForeignCurrency
                    ? current.foreignCurrencyCode
                    : "",
                }));
              }}
            />

            {values.hasForeignCurrency ? (
              <Group grow align="flex-start">
                <NumberInput
                  label="Foreign amount"
                  value={values.foreignAmount}
                  required
                  min={0.01}
                  decimalScale={2}
                  fixedDecimalScale
                  allowNegative={false}
                  onChange={(nextValue) =>
                    setValues((current) => ({
                      ...current,
                      foreignAmount: String(nextValue || ""),
                    }))
                  }
                />
                <Select
                  label="Foreign currency"
                  data={currencyOptions}
                  value={values.foreignCurrencyCode}
                  required
                  searchable
                  disabled={currencyOptions.length === 0}
                  placeholder={
                    currencyOptions.length > 0
                      ? "Select currency"
                      : "No enabled currencies"
                  }
                  onChange={(foreignCurrencyCode) =>
                    setValues((current) => ({
                      ...current,
                      foreignCurrencyCode: foreignCurrencyCode ?? "",
                    }))
                  }
                />
              </Group>
            ) : null}

            <Autocomplete
              label="Description"
              value={values.description}
              data={descriptionSuggestions}
              required
              rightSection={isLoadingDescriptions ? <Loader size="xs" /> : null}
              rightSectionPointerEvents="none"
              onChange={(description) => {
                setValues((current) => ({
                  ...current,
                  description,
                }));
              }}
            />

            <Group grow align="flex-start">
              <Select
                label="Source account"
                data={accountOptions.filter((option) => option.value !== values.destinationId)}
                value={values.sourceId || null}
                searchable
                clearable
                onChange={(nextValue) =>
                  setValues((current) => ({ ...current, sourceId: nextValue ?? "" }))
                }
              />
              <Select
                label="Destination account"
                data={accountOptions.filter((option) => option.value !== values.sourceId)}
                value={values.destinationId || null}
                searchable
                clearable
                onChange={(nextValue) =>
                  setValues((current) => ({ ...current, destinationId: nextValue ?? "" }))
                }
              />
            </Group>

            <Group grow align="flex-start">
              <Autocomplete
                label="Category"
                data={categoryOptions.map((option) => option.label)}
                value={values.categoryName}
                onChange={(categoryName) =>
                  setValues((current) => ({ ...current, categoryName }))
                }
              />
              <TagsInput
                label="Labels"
                data={labelOptions.map((option) => option.label)}
                value={values.tags}
                clearable
                onChange={(nextValue) =>
                  setValues((current) => ({ ...current, tags: nextValue }))
                }
              />
            </Group>

            <Textarea
              label="Notes"
              value={values.notes}
              minRows={3}
              autosize
              onChange={(event) => {
                const notes = event.currentTarget.value;
                setValues((current) => ({ ...current, notes }));
              }}
            />

            <Group
              gap="xs"
              align="center"
              style={{ minHeight: 24, visibility: resultingType ? "visible" : "hidden" }}
            >
              {resultingType ? <ResultingTypeIcon type={resultingType} /> : null}
              <Text size="sm" c="dimmed">
                {resultingType
                  ? `You're creating a ${formatResultingType(resultingType).toLowerCase()}.`
                  : "You're creating a transaction."}
              </Text>
            </Group>

            <Group justify="flex-end" gap="sm" mt="xs">
              <Button
                type="button"
                variant="subtle"
                color="gray"
                leftSection={<IconX size={16} />}
                onClick={resetAndClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                leftSection={<IconDeviceFloppy size={16} />}
                loading={isSubmitting}
                disabled={!resultingType}
              >
                Save
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
