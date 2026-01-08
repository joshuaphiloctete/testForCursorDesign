import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { fetchUsdQuotesById, type Token, type TokenQuotesById } from "../api/coingecko";
import { formatPct, formatUsd } from "../lib/format";

type Row = Token & {
  priceUsd: number | null;
  change24hPct: number | null;
};

const TOKENS: Token[] = [
  { id: "bitcoin", name: "Bitcoin", symbol: "BTC", color: "#F7931A" },
  { id: "ethereum", name: "Ethereum", symbol: "ETH", color: "#627EEA" },
  { id: "solana", name: "Solana", symbol: "SOL", color: "#14F195" },
  { id: "ripple", name: "XRP", symbol: "XRP", color: "#19A7FF" },
  { id: "cardano", name: "Cardano", symbol: "ADA", color: "#2A71D0" },
  { id: "polygon", name: "Polygon", symbol: "POL", color: "#8247E5" }
];

// Reasonable fallback values so the UI still renders offline.
const FALLBACK_QUOTES: TokenQuotesById = {
  bitcoin: { usd: 45000, usd_24h_change: 0.8 },
  ethereum: { usd: 2400, usd_24h_change: -0.3 },
  solana: { usd: 98, usd_24h_change: 1.2 },
  ripple: { usd: 0.62, usd_24h_change: 0.4 },
  cardano: { usd: 0.52, usd_24h_change: -1.1 },
  polygon: { usd: 0.81, usd_24h_change: 0.1 }
};

export function TokenListScreen() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"mcap" | "price">("price"); // simple toggle (price sort only for now)

  const [quotesById, setQuotesById] = useState<TokenQuotesById>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function load(opts?: { useSpinner?: boolean }) {
    const useSpinner = opts?.useSpinner ?? false;
    if (useSpinner) setLoading(true);
    setError(null);
    try {
      const live = await fetchUsdQuotesById({ tokenIds: TOKENS.map((t) => t.id) });
      const merged: TokenQuotesById = { ...FALLBACK_QUOTES, ...live };
      setQuotesById(merged);
      setLastUpdated(new Date());
    } catch (e) {
      setQuotesById((prev) => (Object.keys(prev).length ? prev : FALLBACK_QUOTES));
      setError(e instanceof Error ? e.message : "Failed to load prices");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load({ useSpinner: true });
  }, []);

  const rows: Row[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = TOKENS.filter((t) => {
      if (!q) return true;
      return t.name.toLowerCase().includes(q) || t.symbol.toLowerCase().includes(q);
    });

    const mapped: Row[] = filtered.map((t) => {
      const quote = quotesById[t.id];
      const priceUsd = quote?.usd ?? null;
      const change24hPct = quote?.usd_24h_change ?? null;
      return { ...t, priceUsd, change24hPct };
    });

    if (sort === "price") {
      mapped.sort((a, b) => (b.priceUsd ?? -Infinity) - (a.priceUsd ?? -Infinity));
    }

    return mapped;
  }, [query, quotesById, sort]);

  const header = (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Crypto tokens</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => setSort((s) => (s === "price" ? "mcap" : "price"))}
          style={({ pressed }) => [styles.sortPill, pressed && styles.pressed]}
        >
          <Text style={styles.sortPillText}>Sort: {sort === "price" ? "Price" : "Default"}</Text>
        </Pressable>
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search by name or symbol"
        placeholderTextColor="#7B8698"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.search}
      />

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "—"}
        </Text>
        {error ? <Text style={[styles.metaText, styles.errorText]} numberOfLines={1}>{error}</Text> : null}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        {header}
        <View style={styles.loadingCenter}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>Loading prices…</Text>
        </View>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={header}
      data={rows}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl
          tintColor="#D6DEEA"
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
        />
      }
      renderItem={({ item }) => {
        const change = item.change24hPct;
        const changeColor =
          change === null ? "#7B8698" : change >= 0 ? "#30D158" : "#FF453A";

        return (
          <View style={styles.row}>
            <View style={styles.left}>
              <View style={[styles.avatar, { backgroundColor: item.color }]} />
              <View style={styles.nameWrap}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.symbol}>{item.symbol}</Text>
              </View>
            </View>

            <View style={styles.right}>
              <Text style={styles.price}>
                {item.priceUsd === null ? "—" : formatUsd(item.priceUsd)}
              </Text>
              <Text style={[styles.change, { color: changeColor }]}>
                {change === null ? "—" : formatPct(change)}
              </Text>
            </View>
          </View>
        );
      }}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No matches</Text>
          <Text style={styles.emptyBody}>Try a different name or symbol.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  title: {
    color: "#EAF0FA",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  sortPill: {
    backgroundColor: "#141B28",
    borderColor: "#1E2A40",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  sortPillText: {
    color: "#D6DEEA",
    fontSize: 12,
    fontWeight: "600",
  },
  pressed: { opacity: 0.75 },
  search: {
    backgroundColor: "#121826",
    borderColor: "#1E2A40",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#EAF0FA",
    fontSize: 14,
  },
  metaRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  metaText: {
    color: "#7B8698",
    fontSize: 12,
  },
  errorText: {
    color: "#FF453A",
    flexShrink: 1,
    textAlign: "right",
  },
  list: {
    flex: 1,
    backgroundColor: "#0B0F17",
  },
  listContent: {
    paddingBottom: 24,
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    paddingRight: 12,
  },
  avatar: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  nameWrap: { flex: 1 },
  name: {
    color: "#EAF0FA",
    fontSize: 15,
    fontWeight: "700",
  },
  symbol: {
    color: "#7B8698",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "600",
  },
  right: {
    alignItems: "flex-end",
    minWidth: 120,
  },
  price: {
    color: "#EAF0FA",
    fontSize: 15,
    fontWeight: "700",
  },
  change: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "700",
  },
  separator: {
    height: 1,
    backgroundColor: "#101827",
    marginHorizontal: 16,
  },
  empty: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  emptyTitle: {
    color: "#EAF0FA",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
  },
  emptyBody: {
    color: "#7B8698",
    fontSize: 13,
  },
  loadingWrap: {
    flex: 1,
    backgroundColor: "#0B0F17",
  },
  loadingCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    color: "#7B8698",
    fontSize: 13,
    fontWeight: "600",
  },
});

