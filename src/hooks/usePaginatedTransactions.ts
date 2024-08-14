import { useCallback, useState } from "react";
import { PaginatedRequestParams, PaginatedResponse, Transaction } from "../utils/types";
import { PaginatedTransactionsResult } from "./types";
import { useCustomFetch } from "./useCustomFetch";

export function usePaginatedTransactions(): PaginatedTransactionsResult {
  const { fetchWithCache, loading } = useCustomFetch();
  const [paginatedTransactions, setPaginatedTransactions] = useState<PaginatedResponse<Transaction[]> | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!hasMore) return; // Prevent fetching if no more data is available

    const response = await fetchWithCache<PaginatedResponse<Transaction[]>, PaginatedRequestParams>(
      "paginatedTransactions",
      {
        page: paginatedTransactions === null ? 0 : paginatedTransactions.nextPage,
      }
    );

    setPaginatedTransactions((previousResponse) => {
      if (response === null || response.data.length === 0) {
        setHasMore(false); // No more transactions to load
        return previousResponse;
      }

      return {
        data: [...(previousResponse?.data || []), ...response.data],
        nextPage: response.nextPage,
      };
    });

    if (response?.nextPage === null || response?.data.length === 0) {
      setHasMore(false); // No more pages to load
    }
  }, [fetchWithCache, paginatedTransactions, hasMore]);

  const invalidateData = useCallback(() => {
    setPaginatedTransactions(null);
    setHasMore(true);
  }, []);

  return { data: paginatedTransactions, loading, fetchAll, invalidateData, hasMore };
}
