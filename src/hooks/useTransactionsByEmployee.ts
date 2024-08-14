import { useCallback, useState } from "react";
import { Transaction } from "../utils/types";
import { TransactionsByEmployeeResult } from "./types";
import { useCustomFetch } from "./useCustomFetch";

export function useTransactionsByEmployee(): TransactionsByEmployeeResult {
  const { fetchWithCache, loading } = useCustomFetch();
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextPage, setNextPage] = useState<number | null>(0); // Initialize nextPage to 0

  const fetchById = useCallback(async (employeeId: string) => {
    if (!hasMore || nextPage === null) return; // Prevent fetching if no more data is available or nextPage is null

    const response = await fetchWithCache<Transaction[], { employeeId: string; page: number }>(
      "transactionsByEmployee",
      {
        employeeId,
        page: nextPage,
      }
    );

    setTransactions((prevTransactions) => {
      if (!response || response.length === 0) {
        setHasMore(false); // No more transactions to load
        return prevTransactions;
      }

      setNextPage((prevPage) => (prevPage !== null ? prevPage + 1 : null)); // Increment the page number for the next fetch
      return [...(prevTransactions || []), ...response];
    });

    if (!response || response.length === 0 || response.length < 10) { // Assume 10 items per page; adjust if different
      setHasMore(false); // No more transactions to load
      setNextPage(null); // Set nextPage to null to indicate the end
    }
  }, [fetchWithCache, hasMore, nextPage]);

  const invalidateData = useCallback(() => {
    setTransactions(null);
    setHasMore(true);
    setNextPage(0); // Reset the page number when invalidating data
  }, []);

  return { data: transactions, loading, fetchById, invalidateData, hasMore };
}
