import { useState, useMemo } from 'react';
import { useGetMissingProductsQuery } from '@/features/products/api/products.api';
import { useGetSuppliersQuery } from '@/features/suppliers/api/suppliers.api';
import { Loading } from '@/shared/ui/Loading';
import { ProductImage } from '@/shared/ui/ProductImageю';
import * as XLSX from 'xlsx';

interface MissingProduct {
  id: number;
  name: string;
  manufacturer: string | null;
  product_code: string | null;
  image: string | null;
  notification_threshold: number;
  total_stock: number;
  last_supplier_id: number | null;
}

const MissingProductsPage = () => {
  const { data: products = [], isLoading, isError, error } = useGetMissingProductsQuery();
  const { data: suppliers = [] } = useGetSuppliersQuery();
  const [search, setSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<number | null | 'none'>(null);

  // Create a mapping of supplier ID to name
  const supplierMap = useMemo(() => {
    const map = new Map<number, string>();
    suppliers.forEach(supplier => {
      map.set(supplier.id, supplier.name);
    });
    return map;
  }, [suppliers]);

  // Get suppliers who have missing products
  const suppliersWithMissingProducts = useMemo(() => {
    const supplierIds = new Set<number>();
    products.forEach(product => {
      if (product.last_supplier_id) {
        supplierIds.add(product.last_supplier_id);
      }
    });
    return Array.from(supplierIds)
      .map(id => suppliers.find(supplier => supplier.id === id))
      .filter((supplier): supplier is NonNullable<typeof supplier> => Boolean(supplier))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, suppliers]);

  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    // Filter by search
    if (search) {
      filtered = filtered.filter((product: MissingProduct) =>
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        (product.product_code && product.product_code.toLowerCase().includes(search.toLowerCase())) ||
        (product.manufacturer && product.manufacturer.toLowerCase().includes(search.toLowerCase()))
      );
    }
    
    // Filter by supplier
    if (selectedSupplier === 'none') {
      filtered = filtered.filter((product: MissingProduct) => 
        product.last_supplier_id === null
      );
    } else if (selectedSupplier !== null) {
      filtered = filtered.filter((product: MissingProduct) => 
        product.last_supplier_id === selectedSupplier
      );
    }
    
    return filtered;
  }, [products, search, selectedSupplier]);

  // Export to Excel function
  const exportToExcel = () => {
    const exportData = filteredProducts.map((product) => ({
      'Наименование товара': product.name,
      'Артикул': product.product_code || '—',
      'Производитель': product.manufacturer || '—',
      'Текущий остаток': product.total_stock,
      'Порог уведомления': product.notification_threshold,
      'Недостает': product.notification_threshold - product.total_stock,
      'Поставщик': product.last_supplier_id 
        ? supplierMap.get(product.last_supplier_id) || 'Неизвестный поставщик' 
        : '—'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Недостающие товары');
    
    // Auto-size columns
    const colWidths = Object.keys(exportData[0] || {}).map(() => ({ wch: 20 }));
    ws['!cols'] = colWidths;
    
    // Generate filename with current date
    const date = new Date().toLocaleDateString('ru-RU').replace(/\./g, '-');
    XLSX.writeFile(wb, `недостающие-товары-${date}.xlsx`);
  };

  if (isLoading) return <Loading text="недостающих товаров" />;
  if (isError) return (
    <div className="text-center py-10">
      <div className="text-red-500 font-medium mb-2">Ошибка загрузки недостающих товаров</div>
      <div className="text-red-400 text-sm bg-red-50 border border-red-200 rounded-lg p-4 max-w-2xl mx-auto">
        <div className="font-mono text-left break-all">
          {error && typeof error === 'object' && 'data' in error ? 
            JSON.stringify(error.data, null, 2) : 
            error && typeof error === 'object' && 'message' in error ?
              error.message :
              String(error || 'Неизвестная ошибка')
          }
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-slate-800">Недостающие товары</h2>
          <p className="text-sm text-slate-500">Товары с количеством ниже порога уведомления</p>
          <div className="mt-1 text-sm font-medium text-blue-600">
            Всего: {filteredProducts.length} товаров
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={exportToExcel}
            disabled={filteredProducts.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 focus:ring-2 focus:ring-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Экспорт
          </button>
          
          <div className="relative w-full sm:w-72">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              width="18"
              height="18"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M14 14L10.25 10.25M10.25 10.25C10.6478 9.85217 10.9647 9.38057 11.183 8.85821C11.4013 8.33585 11.5155 7.77238 11.518 7.2C11.5155 6.62761 11.4013 6.06414 11.183 5.54178C10.9647 5.01942 10.6478 4.54782 10.25 4.15C9.85217 3.75217 9.38057 3.43526 8.85821 3.21695C8.33585 2.99865 7.77238 2.8845 7.2 2.882C6.62761 2.8845 6.06414 2.99865 5.54178 3.21695C5.01942 3.43526 4.54782 3.75217 4.15 4.15C3.75217 4.54782 3.43526 5.01942 3.21695 5.54178C2.99865 6.06414 2.8845 6.62761 2.882 7.2C2.8845 7.77238 2.99865 8.33585 3.21695 8.85821C3.43526 9.38057 3.75217 9.85217 4.15 10.25C4.54782 10.6478 5.01942 10.9647 5.54178 11.183C6.06414 11.4013 6.62761 11.5155 7.2 11.518C7.77238 11.5155 8.33585 11.4013 8.85821 11.183C9.38057 10.9647 9.85217 10.6478 10.25 10.25Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск товара…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative w-full sm:w-48">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              width="18"
              height="18"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.5 3.75C7.5 3.75 5 6.25 5 7.5C5 8.75 6.25 10 7.5 10C8.75 10 10 8.75 10 7.5C10 6.25 7.5 3.75 7.5 3.75Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2.5 12.5H12.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <select
              value={selectedSupplier === null ? '' : selectedSupplier}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  setSelectedSupplier(null);
                } else if (value === 'none') {
                  setSelectedSupplier('none');
                } else {
                  setSelectedSupplier(Number(value));
                }
              }}
              className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="">Все поставщики</option>
              <option value="none">Без поставщика</option>
              {suppliersWithMissingProducts.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:hidden">
        {filteredProducts.map((product: MissingProduct) => (
          <div
            key={product.id}
            className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-shrink-0">
                <ProductImage src={product.image || ''} alt={product.name} size={80} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 truncate text-sm sm:text-base">{product.name}</h3>
                    <div className="flex flex-col gap-1">
                      <p className="text-xs text-slate-500 truncate">
                        {product.manufacturer || <span className="text-slate-400">—</span>}
                      </p>
                      <div className="text-xs text-slate-500">
                        <span className="text-slate-400">Артикул:</span> <span className="font-mono">{product.product_code || '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-3 text-sm">
                    <div className="inline-flex items-center gap-1">
                      <span className="text-slate-500">Остаток:</span>
                      <span className="font-medium text-red-600">{product.total_stock}</span>
                    </div>
                    <div className="inline-flex items-center gap-1">
                      <span className="text-slate-500">Порог:</span>
                      <span className="font-medium text-slate-700">{product.notification_threshold}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">Недостает:</span>
                    <span className="font-medium text-red-600">
                      {product.notification_threshold - product.total_stock}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">Поставщик:</span>
                    <span className="font-medium text-slate-600">
                      {product.last_supplier_id ? supplierMap.get(product.last_supplier_id) || 'Неизвестный поставщик' : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200">
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Товар</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Артикул</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Производитель</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Остаток</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Порог</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Недостает</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Поставщик</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product: MissingProduct) => (
                <tr key={product.id} className="group hover:bg-slate-50/80 transition-colors duration-150 ease-in-out">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="relative flex-shrink-0">
                        <ProductImage src={product.image || ''} alt={product.name} size={40} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-slate-800 truncate max-w-[200px] group-hover:text-slate-900">
                          {product.name}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="max-w-[150px]">
                      <span className="text-sm font-mono">{product.product_code || '—'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-[150px]">
                      <span className={`text-sm ${product.manufacturer ? 'text-slate-600' : 'text-slate-400 italic'}`}>
                        {product.manufacturer || '—'}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center justify-end gap-1">
                      <span className="text-red-600 font-medium">{product.total_stock}</span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center justify-end gap-1">
                      <span className="text-slate-600 font-medium">{product.notification_threshold}</span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center justify-end gap-1">
                      <span className="font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-md">
                        {product.notification_threshold - product.total_stock}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-left">
                    <div className="inline-flex items-center gap-1">
                      <span className="font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded-md">
                        {product.last_supplier_id ? supplierMap.get(product.last_supplier_id) || 'Неизвестный поставщик' : '—'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-16 text-center">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                </svg>
              </div>
              <div className="text-slate-500">Недостающих товаров нет</div>
              <div className="text-sm text-slate-400 max-w-sm">
                Все товары находятся выше установленного порога уведомления
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MissingProductsPage;