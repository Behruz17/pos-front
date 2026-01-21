/* eslint-disable @typescript-eslint/no-explicit-any */
import { notification } from 'antd'
import codeMessages from './codeMessages'

type HttpError = {
  status?: number
  data?: {
    error?: string
  }
}

export const errorHandler = (error: any) => {
  if (!navigator.onLine) {
    notification.config({
      duration: 15,
      maxCount: 1,
    })
    notification.error({
      message: 'No internet connection',
      description: 'Cannot connect to the Internet, Check your internet network',
    })
    return {
      success: false,
      result: null,
      message: 'Cannot connect to the server, Check your internet network',
    }
  }
  const response = error as HttpError

  if (!response) {
    notification.config({
      duration: 20,
      maxCount: 1,
    })

    return {
      success: false,
      result: null,
      message: 'Cannot connect to the server, Contact your Account administrator',
    }
  }

  if (response && response?.status) {
    const message = response?.data && response.data.error

    const errorText = message || (codeMessages as any)[response.status]

    const { status } = response
    notification.config({
      duration: 20,
      maxCount: 2,
    })
    notification.error({
      message: `Request error ${status}`,
      description: errorText,
    })
  } else {
    notification.config({
      duration: 15,
      maxCount: 1,
    })

    if (navigator.onLine) {
      notification.error({
        message: 'Problem connecting to server',
        description: 'Cannot connect to the server, Try again later',
      })
      return {
        success: false,
        result: null,
        message: 'Cannot connect to the server, Contact your Account administrator',
      }
    } else {
      notification.error({
        message: 'No internet connection',
        description: 'Cannot connect to the Internet, Check your internet network',
      })
      return {
        success: false,
        result: null,
        message: 'Cannot connect to the server, Check your internet network',
      }
    }
  }
}
