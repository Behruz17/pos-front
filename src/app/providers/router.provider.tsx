import { RouterProvider } from 'react-router'
import { router } from '../routers'

export const RoutersProvider = () => {
  return <RouterProvider router={router} />
}
