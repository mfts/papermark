export type Currency = "usd" | "eur";

export const CURRENCY_LABEL: Record<Currency, string> = {
    usd: "USD",
    eur: "EUR"
}

export const CURRENCY_SYMBOL: Record<Currency, string> = {
    usd: "$",
    eur: "€",
}