import { Image, Space } from 'antd'
import { ZoomIn } from 'lucide-react'

type Props = {
  src: string
  alt: string
  size?: number
}

export const ProductImage = ({ src, alt, size = 40 }: Props) => {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="rounded-lg object-cover border"
      preview={{
        cover: (
          <Space orientation="vertical" align="center">
            <ZoomIn size={18} />
            <span className="text-xs">Открыть</span>
          </Space>
        ),
      }}
      onClick={(e) => e.stopPropagation()} // 🔥 КРИТИЧНО
    />
  )
}
