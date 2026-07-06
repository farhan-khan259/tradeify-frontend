import { TransactionManager } from "../../components/admin/TransactionManager";

export function AdminWithdrawals() {
  return (
    <TransactionManager
      type="withdrawal"
      title="Withdrawals"
      subtitle="Review pending withdrawal requests and view completed withdrawals."
    />
  );
}
