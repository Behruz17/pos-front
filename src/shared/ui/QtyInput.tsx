import { useEffect, useState, type InputHTMLAttributes, type Ref } from 'react'

// Up to 3 digits after the separator, e.g. 0.5, 1,25, 2.125
const QTY_PATTERN = /^\d*([.,]\d{0,3})?$/

export const parseQty = (text: string) => Number(text.replace(',', '.')) || 0

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  value: number
  onValueChange: (value: number) => void
  ref?: Ref<HTMLInputElement>
}

/**
 * Quantity input that accepts fractional values (0.5 pcs).
 * Keeps the typed text locally so intermediate states like "0." or "1," are not lost.
 */
export const QtyInput = ({ value, onValueChange, ref, ...rest }: Props) => {
  const [text, setText] = useState(value ? String(value) : '')

  // Sync when the value is changed from outside (row reset, draft loaded, etc.)
  useEffect(() => {
    setText((prev) => (parseQty(prev) === value ? prev : value ? String(value) : ''))
  }, [value])

  return (
    <input
      ref={ref}
      type="text"
      inputMode="decimal"
      value={text}
      onChange={(e) => {
        const v = e.target.value.trim()
        if (!QTY_PATTERN.test(v)) return
        setText(v)
        onValueChange(parseQty(v))
      }}
      {...rest}
    />
  )
}
