/* eslint-disable @typescript-eslint/no-explicit-any */
export const Th = ({ children, right }: any) => (
  <th className={`px-4 py-3 font-medium text-slate-600 ${right && 'text-right'}`}>{children}</th>
)

export const Td = ({ children, right, className = '' }: any) => (
  <td className={`px-4 py-3 ${right && 'text-right'} ${className}`}>{children}</td>
)

export const ActionButton = ({ icon, onClick }: any) => (
  <button onClick={onClick} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition">
    {icon}
  </button>
)
