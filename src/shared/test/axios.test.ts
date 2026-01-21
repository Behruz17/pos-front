import axios from 'axios'
import { env } from '../env'
import Cookie from 'js-cookie'

export const testAxiosSpeed = async (iterations = 10) => {
  const times: number[] = []

  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    await axios.get(env.VITE_BASE_SERVER_URL + '/auth/me', {
      headers: {
        Authorization: `Bearer ${Cookie.get('token')}`,
      },
    })
    const end = performance.now()
    times.push(end - start)
  }

  console.table({
    min: Math.min(...times).toFixed(2),
    max: Math.max(...times).toFixed(2),
    avg: (times.reduce((a, b) => a + b, 0) / times.length).toFixed(2),
  })
}
