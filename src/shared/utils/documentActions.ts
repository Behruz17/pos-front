import { toast } from 'sonner'

const printStyles = `
  body { font-family: Arial, sans-serif; padding: 24px; color: #1e293b; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  p.subtitle { font-size: 12px; color: #64748b; margin: 0 0 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
  th { background: #f1f5f9; }
  tr.total-row td { font-weight: 700; background: #f8fafc; }
  @media print { body { padding: 0; } }
`

const openPrintWindow = (html: string) => {
  const printWindow = window.open('', '_blank', 'width=1000,height=700')
  if (!printWindow) {
    toast.error('Не удалось открыть окно печати. Разрешите всплывающие окна для этого сайта.')
    return
  }
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  printWindow.onload = () => {
    printWindow.print()
  }
}

/**
 * Prints a list of plain-object rows (same shape used to build an Excel sheet) as an HTML table.
 */
export function printRows(
  title: string,
  rows: Record<string, string | number>[],
  options?: { subtitle?: string }
) {
  if (!rows.length) {
    toast.error('Нет данных для печати')
    return
  }

  const headers = Object.keys(rows[0])
  const tableRows = rows
    .map((row) => {
      const isTotal = String(row[headers[0]] ?? '').toUpperCase() === 'ИТОГО'
      const cells = headers.map((h) => `<td>${row[h] ?? ''}</td>`).join('')
      return `<tr${isTotal ? ' class="total-row"' : ''}>${cells}</tr>`
    })
    .join('')

  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>${printStyles}</style>
      </head>
      <body>
        <h1>${title}</h1>
        ${options?.subtitle ? `<p class="subtitle">${options.subtitle}</p>` : ''}
        <table>
          <thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
    </html>
  `

  openPrintWindow(html)
}

/**
 * Prints raw HTML content (used when the export data is not a flat list of rows,
 * e.g. a document with a header section followed by a table).
 */
export function printHtml(title: string, bodyHtml: string) {
  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>${printStyles}</style>
      </head>
      <body>${bodyHtml}</body>
    </html>
  `
  openPrintWindow(html)
}

// The OS-level "pick an app" file share sheet (navigator.share with files) is well
// supported on mobile Chrome/Safari — the user picks Telegram/WhatsApp directly and the
// image attaches. On desktop it is either unsupported or can silently hang without ever
// resolving or rejecting, which looks like the button "does nothing", so desktop just
// downloads the image(s) and the user attaches them in the chat themselves.
const isMobileDevice = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const measureColumnWidths = (
  ctx: CanvasRenderingContext2D,
  headers: string[],
  rows: Record<string, string | number>[]
) => {
  const minWidth = 90
  const maxWidth = 260
  const cellPadding = 24

  return headers.map((header) => {
    ctx.font = 'bold 14px Arial'
    let widest = ctx.measureText(header).width
    ctx.font = '14px Arial'
    rows.forEach((row) => {
      const width = ctx.measureText(String(row[header] ?? '')).width
      if (width > widest) widest = width
    })
    return Math.min(maxWidth, Math.max(minWidth, Math.ceil(widest) + cellPadding))
  })
}

const truncateText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  if (ctx.measureText(text).width <= maxWidth) return text
  let truncated = text
  while (truncated.length > 1 && ctx.measureText(`${truncated}…`).width > maxWidth) {
    truncated = truncated.slice(0, -1)
  }
  return `${truncated}…`
}

// canvas.toDataURL is synchronous, unlike canvas.toBlob (which defers its callback to a
// later task). Decoding the data URL by hand keeps the whole image-generation step
// synchronous too, so nothing runs between the click and navigator.share() — on mobile,
// any task-queue gap there can expire the browser's "user gesture" window and make
// navigator.share() reject, which otherwise looks exactly like a random failure.
const dataUrlToBlob = (dataUrl: string): Blob => {
  const [header, base64] = dataUrl.split(',')
  const mimeMatch = header.match(/data:(.*?);base64/)
  const mime = mimeMatch ? mimeMatch[1] : 'image/png'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

// A tall image is awkward to view in a chat (and risks hitting the browser's canvas size
// limit), so long tables are split into several page-sized images instead of one giant one.
const MAX_ROWS_PER_IMAGE = 40

const splitRowsIntoPages = (
  rows: Record<string, string | number>[]
): Record<string, string | number>[][] => {
  if (rows.length === 0) return []

  const headers = Object.keys(rows[0])
  const lastRow = rows[rows.length - 1]
  const hasTotalRow = String(lastRow[headers[0]] ?? '').toUpperCase() === 'ИТОГО'
  const dataRows = hasTotalRow ? rows.slice(0, -1) : rows

  if (dataRows.length <= MAX_ROWS_PER_IMAGE) {
    return [rows]
  }

  const pages: Record<string, string | number>[][] = []
  for (let i = 0; i < dataRows.length; i += MAX_ROWS_PER_IMAGE) {
    pages.push(dataRows.slice(i, i + MAX_ROWS_PER_IMAGE))
  }
  if (hasTotalRow) {
    pages[pages.length - 1] = [...pages[pages.length - 1], lastRow]
  }
  return pages
}

/**
 * Renders a list of plain-object rows (same shape used to build an Excel sheet) as a
 * PNG image — legible when pasted or attached directly into a chat app. Synchronous on
 * purpose (see dataUrlToBlob above).
 */
const rowsToImageBlob = (
  title: string,
  rows: Record<string, string | number>[],
  options?: { subtitle?: string }
): Blob => {
  if (!rows.length) {
    throw new Error('No rows to render')
  }

  const headers = Object.keys(rows[0])
  const measureCanvas = document.createElement('canvas')
  const measureCtx = measureCanvas.getContext('2d')
  if (!measureCtx) {
    throw new Error('Canvas not supported')
  }
  const colWidths = measureColumnWidths(measureCtx, headers, rows)

  const padding = 20
  const rowHeight = 32
  const headerHeight = 38
  const titleHeight = options?.subtitle ? 60 : 44
  const tableWidth = colWidths.reduce((a, b) => a + b, 0)
  const width = tableWidth + padding * 2
  const height = titleHeight + headerHeight + rows.length * rowHeight + padding * 2

  const scale = 2
  const canvas = document.createElement('canvas')
  canvas.width = width * scale
  canvas.height = height * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas not supported')
  }
  ctx.scale(scale, scale)
  ctx.textBaseline = 'middle'

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = '#0f172a'
  ctx.font = 'bold 20px Arial'
  ctx.fillText(title, padding, padding + 12)

  if (options?.subtitle) {
    ctx.fillStyle = '#64748b'
    ctx.font = '13px Arial'
    ctx.fillText(options.subtitle, padding, padding + 34)
  }

  let y = titleHeight + padding
  ctx.fillStyle = '#f1f5f9'
  ctx.fillRect(padding, y, tableWidth, headerHeight)
  ctx.strokeStyle = '#cbd5e1'
  ctx.strokeRect(padding, y, tableWidth, headerHeight)

  ctx.fillStyle = '#334155'
  ctx.font = 'bold 13px Arial'
  let x = padding
  headers.forEach((header, i) => {
    ctx.fillText(truncateText(ctx, header, colWidths[i] - 16), x + 8, y + headerHeight / 2)
    x += colWidths[i]
  })
  y += headerHeight

  rows.forEach((row) => {
    const isTotal = String(row[headers[0]] ?? '').toUpperCase() === 'ИТОГО'
    if (isTotal) {
      ctx.fillStyle = '#f8fafc'
      ctx.fillRect(padding, y, tableWidth, rowHeight)
    }
    ctx.strokeStyle = '#e2e8f0'
    ctx.strokeRect(padding, y, tableWidth, rowHeight)

    ctx.fillStyle = isTotal ? '#0f172a' : '#1e293b'
    ctx.font = isTotal ? 'bold 13px Arial' : '13px Arial'
    let cx = padding
    headers.forEach((header, i) => {
      const text = truncateText(ctx, String(row[header] ?? ''), colWidths[i] - 16)
      ctx.fillText(text, cx + 8, y + rowHeight / 2)
      cx += colWidths[i]
    })
    y += rowHeight
  })

  return dataUrlToBlob(canvas.toDataURL('image/png'))
}

const quickShareLinksToast = () => {
  toast('Или отправьте через Telegram', {
    action: { label: 'Открыть Telegram', onClick: () => window.open('https://web.telegram.org/', '_blank') },
  })
}

const downloadForManualShare = (blobs: Blob[], fileNames: string[]) => {
  blobs.forEach((blob, i) => downloadBlob(blob, fileNames[i]))

  const message =
    blobs.length === 1
      ? 'Изображение скачано'
      : `Таблица большая — скачано ${blobs.length} изображений (по страницам)`

  toast.info(message, {
    description: 'Прикрепите его в чат вручную',
    action: { label: 'Открыть WhatsApp', onClick: () => window.open('https://web.whatsapp.com/', '_blank') },
  })
  quickShareLinksToast()
}

/**
 * Renders the given rows as one or more images (long tables are split into page-sized
 * images) and shares them — via the native share sheet on mobile (Telegram/WhatsApp show
 * up as targets directly and accept multiple images as an album), or by downloading the
 * image(s) on desktop so the user can attach them in WhatsApp Web / Telegram Web themselves.
 */
export async function shareRowsAsImage(
  title: string,
  rows: Record<string, string | number>[],
  fileNameBase: string,
  options?: { subtitle?: string }
) {
  if (!rows.length) {
    toast.error('Нет данных для отправки')
    return
  }

  // Deliberately not awaiting anything before navigator.share() below — see
  // dataUrlToBlob/rowsToImageBlob for why this whole block stays synchronous.
  let blobs: Blob[]
  let fileNames: string[]
  try {
    const pages = splitRowsIntoPages(rows)
    blobs = pages.map((pageRows, i) => {
      const pageSubtitle =
        pages.length > 1
          ? [options?.subtitle, `Страница ${i + 1} из ${pages.length}`].filter(Boolean).join(' · ')
          : options?.subtitle
      return rowsToImageBlob(title, pageRows, { subtitle: pageSubtitle })
    })
    fileNames = blobs.map((_, i) => (blobs.length > 1 ? `${fileNameBase}_${i + 1}.png` : `${fileNameBase}.png`))
  } catch (error) {
    console.error('Error rendering share image:', error)
    toast.error('Произошла ошибка при подготовке изображения')
    return
  }

  if (isMobileDevice() && typeof navigator.share === 'function') {
    try {
      const files = blobs.map((blob, i) => new File([blob], fileNames[i], { type: 'image/png' }))
      if (navigator.canShare && navigator.canShare({ files })) {
        await navigator.share({ files, title })
        return
      }
    } catch (error) {
      if ((error as DOMException)?.name === 'AbortError') return
      // navigator.share can reject for reasons outside our control (no compatible share
      // target, a webview that half-implements the API, etc.) — fall back to a plain
      // download instead of leaving the user with nothing.
      console.error('navigator.share failed, falling back to download:', error)
    }
  }

  try {
    downloadForManualShare(blobs, fileNames)
  } catch (error) {
    console.error('Error downloading share image:', error)
    const detail = error instanceof Error ? error.message : String(error)
    toast.error(`Произошла ошибка при отправке изображения: ${detail}`)
  }
}
