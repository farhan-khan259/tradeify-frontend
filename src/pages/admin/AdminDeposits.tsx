import { TransactionManager } from "../../components/admin/TransactionManager";

export function AdminDeposits() {
  return (
    <TransactionManager
      type="deposit"
      title="Deposits"
      subtitle="Review pending deposit requests and view completed deposits."
    />
  );
}
