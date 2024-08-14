import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { InputSelect } from "./components/InputSelect";
import { Instructions } from "./components/Instructions";
import { Transactions } from "./components/Transactions";
import { useEmployees } from "./hooks/useEmployees";
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions";
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee";
import { EMPTY_EMPLOYEE } from "./utils/constants";
import { Employee } from "./utils/types";

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees();
  const { data: paginatedTransactions, hasMore: hasMorePaginated, ...paginatedTransactionsUtils } = usePaginatedTransactions();
  const { data: transactionsByEmployee, hasMore: hasMoreFiltered, ...transactionsByEmployeeUtils } = useTransactionsByEmployee();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(EMPTY_EMPLOYEE);

  const transactions = useMemo(() => {
    if (selectedEmployee && selectedEmployee.id !== EMPTY_EMPLOYEE.id) {
      return transactionsByEmployee ?? [];
    }
    return paginatedTransactions?.data ?? [];
  }, [paginatedTransactions, transactionsByEmployee, selectedEmployee]);

  const hasMore = selectedEmployee && selectedEmployee.id !== EMPTY_EMPLOYEE.id ? hasMoreFiltered : hasMorePaginated;

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true);
    transactionsByEmployeeUtils.invalidateData();

    try {
      await employeeUtils.fetchAll();
      await paginatedTransactionsUtils.fetchAll();
    } finally {
      setIsLoading(false);
    }
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils]);

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData();
      await transactionsByEmployeeUtils.fetchById(employeeId);
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  );

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions();
    }
  }, [employeeUtils.loading, employees, loadAllTransactions]);

  const handleEmployeeChange = useCallback(
    async (newEmployee: Employee | null) => {
      if (newEmployee === null) return;

      setSelectedEmployee(newEmployee);

      if (newEmployee.id === EMPTY_EMPLOYEE.id) {
        // Reset to show all transactions
        await loadAllTransactions();
      } else {
        // Filter transactions by the selected employee
        await loadTransactionsByEmployee(newEmployee.id);
      }
    },
    [loadAllTransactions, loadTransactionsByEmployee]
  );

  const handleViewMore = useCallback(async () => {
    if (selectedEmployee && selectedEmployee.id !== EMPTY_EMPLOYEE.id) {
      await loadTransactionsByEmployee(selectedEmployee.id);
    } else {
      await loadAllTransactions();
    }
  }, [loadAllTransactions, loadTransactionsByEmployee, selectedEmployee]);

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isLoading}
          defaultValue={selectedEmployee}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={handleEmployeeChange}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} />

          {transactions.length > 0 && hasMore && (
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading || transactionsByEmployeeUtils.loading}
              onClick={handleViewMore}
            >
              View More
            </button>
          )}

          {!hasMore && (
            <p>No more transactions to load.</p>
          )}
        </div>
      </main>
    </Fragment>
  );
}
