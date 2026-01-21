export const Field = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
  <div>
    <label className="block text-sm font-medium mb-1">{label}</label>
    <input
      value={value}
      onChange={(e) => {
        const v = e.target.value.trim()
        if (!/^\d*(\.\d*)?$/.test(v)) return
        onChange(Number(v))
      }}
      className="w-full rounded-lg border px-3 py-2 text-sm font-mono"
    />
  </div>
)
