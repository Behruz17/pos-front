import { useState } from 'react'

import { Warehouses } from './Warehouses'
import { WarehouseProducts } from './WarehouseProducts'
import { ProductCard } from './ProductCard'

const WarehouseStockPage = () => {
  const [warehouseId, setWarehouseId] = useState<number | null>(null)
  const [productId, setProductId] = useState<number | null>(null)

  return (
    <div>
      {!warehouseId && <Warehouses onSelect={setWarehouseId} />}

      {warehouseId && !productId && (
        <WarehouseProducts
          warehouseId={warehouseId}
          onBack={() => setWarehouseId(null)}
          onSelectProduct={setProductId}
        />
      )}

      {warehouseId && productId && (
        <ProductCard warehouseId={warehouseId} productId={productId} onBack={() => setProductId(null)} />
      )}
    </div>
  )
}

export default WarehouseStockPage
