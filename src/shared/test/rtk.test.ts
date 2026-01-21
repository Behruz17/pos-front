import { store } from '@/app/store'
import { authApi } from '@/features/auth/api/auth.api'

export const testGetMeSpeed = async (iterations = 10) => {
  const times: number[] = []

  for (let i = 0; i < iterations; i++) {
    const start = performance.now()

    await store.dispatch(
      authApi.endpoints.getMe.initiate(undefined, {
        forceRefetch: true,
      })
    )

    const end = performance.now()
    times.push(end - start)
  }

  console.table({
    min: Math.min(...times).toFixed(2),
    max: Math.max(...times).toFixed(2),
    avg: (times.reduce((a, b) => a + b, 0) / times.length).toFixed(2),
  })

  return times
}
