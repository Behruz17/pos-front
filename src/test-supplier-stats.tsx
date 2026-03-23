// Тестовый компонент для проверки API
import { useGetSupplierStatsQuery } from '@/features/suppliers/api/suppliers.api';

const TestSupplierStats = () => {
  const { data, isLoading, isError, error } = useGetSupplierStatsQuery({ warehouse_id: 1 });

  console.log('Test - data:', data);
  console.log('Test - error:', error);

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {JSON.stringify(error)}</div>;
  
  return (
    <div>
      <h3>Test Supplier Stats</h3>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default TestSupplierStats;
