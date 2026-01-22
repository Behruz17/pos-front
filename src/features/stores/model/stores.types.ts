export interface TStore {
  id: number
  name: string
  city: string | null
  warehouse_id: number
  warehouse_name: string
}

export interface TCreateStore {
  name: string
  city?: string
  warehouse_id: number
}

export interface TUpdateStore {
  name?: string
  city?: string
  warehouse_id?: number
}
