import { useState, useMemo } from 'react';
import { useGetMissingProductsQuery } from '@/features/products/api/products.api';
import { Loading } from '@/shared/ui/Loading';
import { ProductImage } from '@/shared/ui/ProductImageю';

interface MissingProduct {
  id: number;
  name: string;
  manufacturer: string | null;
  product_code: string;
  image: string;
  notification_threshold: number;
  total_stock: number;
}

const MissingProductsPage = () => {
  const { data: products = [], isLoading, isError } = useGetMissingProductsQuery();
  const [search, setSearch] = useState('');

  const filteredProducts = useMemo(() => {
    if (!search) return products;
    return products.filter((product: MissingProduct) =>
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      (product.product_code && product.product_code.toLowerCase().includes(search.toLowerCase())) ||
      (product.manufacturer && product.manufacturer.toLowerCase().includes(search.toLowerCase()))
    );
  }, [products, search]);

  if (isLoading) return <Loading text="недостающих товаров" />;
  if (isError) return <div className="text-center text-red-500 py-10">Ошибка загрузки недостающих товаров</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-slate-800">Недостающие товары</h2>
          <p className="text-sm text-slate-500">Товары с количеством ниже порога уведомления</p>
        </div>

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
      </div>

      <div className="grid gap-4 md:hidden">
        {filteredProducts.map((product: MissingProduct) => (
          <div
            key={product.id}
            className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-shrink-0">
                <ProductImage src={product.image} alt={product.name} size={80} />
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
                        <span className="text-slate-400">Артикул:</span> <span className="font-mono">{product.product_code}</span>
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
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200">
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Товар</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Артикул</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Производитель</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Остаток</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Порог</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Недостает</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product: MissingProduct) => (
                <tr key={product.id} className="group hover:bg-slate-50/80 transition-colors duration-150 ease-in-out">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="relative flex-shrink-0">
                        <ProductImage src={product.image} alt={product.name} size={40} />
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
                      <span className="text-sm font-mono">{product.product_code}</span>
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