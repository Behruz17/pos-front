import { useMemo, useState } from 'react'
import { Edit2, Package, Plus, Search, Trash2 } from 'lucide-react'
import { useDeleteProductMutation, useGetProductsQuery } from '@/features/products/api/products.api'
import { useAuth } from '@/features/auth/hooks/auth.hooks'
import { formatDateTime } from '@/shared/formatDateTime'
import DeleteModal from '@/widgets/modals/DeleteModal'
import { Loading } from '@/shared/ui/Loading'
import { CreateProductModal } from '@/widgets/modals/CreateProductModal'
import { ProductImage } from '@/shared/ui/ProductImageю'
import EditProductModal from '@/widgets/modals/EditProductModal'

const ProductsPage = () => {
  const { data: products = [], isLoading } = useGetProductsQuery()
  const { isAdmin } = useAuth()
  const [editProduct, setEditProduct] = useState<null | {
    id: number
    name: string
    manufacturer: string
    image: string
    created_at: string
  }>(null)

  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [openProductModal, setOpenProductModal] = useState(false)

  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation()

  const filtered = useMemo(() => {
    return products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
  }, [products, search])

  const onDelete = async () => {
    if (!deleteId) return
    await deleteProduct(deleteId).unwrap()
    setDeleteId(null)
  }

  if (isLoading) return <Loading text="товаров" />

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-slate-800">Каталог товаров</h2>
          <p className="text-sm text-slate-500">Полный список продукции</p>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск товара…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {isAdmin && (
            <button
              onClick={() => setOpenProductModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700 transition"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Добавить</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:hidden">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-shrink-0">
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-full sm:w-20 h-35 rounded-xl object-cover border border-slate-100 object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 truncate text-sm sm:text-base">{p.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 truncate">
                      {p.manufacturer || <span className="text-slate-400">—</span>}
                    </p>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <button
                        onClick={() =>
                          setEditProduct({
                            id: p.id,
                            name: p.name,
                            manufacturer: p.manufacturer ?? '',
                            image: p.image,
                            created_at: p.created_at,
                          })
                        }
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Редактировать"
                        aria-label="Редактировать товар"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteId(p.id)}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                        title="Удалить"
                        aria-label="Удалить товар"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-3 text-sm">
                    <div className="inline-flex items-center gap-1">
                      <span className="text-slate-500">Закупка:</span>
                      <span className="font-medium text-slate-700">{p.purchase_cost} c</span>
                    </div>
                    <div className="inline-flex items-center gap-1">
                      <span className="text-slate-500">Продажа:</span>
                      <span className="font-semibold text-emerald-600">{p.selling_price} c</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">Остаток:</span>
                    <span className="font-medium text-slate-800">{p.total_stock}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">Последняя цена:</span>
                    <span className="font-medium text-slate-800">{p.last_unit_price} c</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <span>Создан:</span>
                    <time dateTime={p.created_at} className="font-medium">
                      {formatDateTime(p.created_at)}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {!filtered.length && <div className="text-center text-slate-500 py-10">Товары не найдены</div>}
      </div>
      <div className="hidden md:block border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200">
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Товар
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Производитель
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Закупка
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Цена
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Остаток
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Создан
                </th>
                {isAdmin && (
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Действия
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="group hover:bg-slate-50/80 transition-colors duration-150 ease-in-out">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="relative flex-shrink-0">
                        <ProductImage src={p.image} alt={p.name} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-slate-800 truncate max-w-[200px] group-hover:text-slate-900">
                          {p.name}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          <span className="font-medium">{p.last_unit_price} c</span>
                          <span className="text-slate-400 ml-1">последняя</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="max-w-[150px]">
                      <span className={`text-sm ${p.manufacturer ? 'text-slate-600' : 'text-slate-400 italic'}`}>
                        {p.manufacturer || '—'}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center justify-end gap-1">
                      <span className="text-slate-600 font-medium">{p.purchase_cost}</span>
                      <span className="text-xs text-slate-400">c</span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center justify-end gap-1">
                      <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                        {p.selling_price}
                      </span>
                      <span className="text-xs text-emerald-400">c</span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center justify-center gap-1">
                      <span
                        className={`font-semibold px-3 py-1.5 rounded-full text-sm ${
                          parseInt(p.total_stock) > 50
                            ? 'bg-blue-50 text-blue-700'
                            : parseInt(p.total_stock) > 10
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {p.total_stock}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-500">
                      <div className="font-medium text-slate-700">{formatDateTime(p.created_at)}</div>
                    </div>
                  </td>

                  {isAdmin && (
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() =>
                            setEditProduct({
                              id: p.id,
                              name: p.name,
                              manufacturer: p.manufacturer ?? '',
                              image: p.image,
                              created_at: p.created_at,
                            })
                          }
                          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors duration-150"
                          title="Редактировать"
                          aria-label="Редактировать товар"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteId(p.id)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors duration-150"
                          title="Удалить"
                          aria-label="Удалить товар"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}

              {!filtered.length && (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                        <Package className="w-6 h-6 text-slate-400" />
                      </div>
                      <div className="text-slate-500">Товары не найдены</div>
                      <div className="text-sm text-slate-400 max-w-sm">
                        Попробуйте изменить параметры поиска или фильтрации
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <span className="font-medium">{filtered.length}</span>
                <span>товаров</span>
              </div>
              <div className="text-slate-400">
                <span className="font-medium">Общий остаток:</span>
                <span className="ml-2 text-slate-700">
                  {filtered.reduce((sum, p) => sum + parseInt(p.total_stock || '0'), 0)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {deleteId && <DeleteModal isLoading={isDeleting} onClose={() => setDeleteId(null)} onDelete={onDelete} />}

      {openProductModal && <CreateProductModal onClose={() => setOpenProductModal(false)} />}
      {editProduct && <EditProductModal product={editProduct} onClose={() => setEditProduct(null)} />}
    </div>
  )
}

export default ProductsPage
