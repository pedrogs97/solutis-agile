// src/components/Image.tsx
import { type CSSProperties, type ImgHTMLAttributes, useState } from 'react'

/** What vite-imagetools returns when using `&as=picture` */
export type PictureData = {
  sources: Array<{ type?: string; srcset: string }>
  img: { src: string; srcset?: string }
}

type BaseProps = {
  alt: string
  sizes?: string
  priority?: boolean
  /** Optional tiny placeholder (e.g. `?w=24&blur=20&format=webp`) */
  blurSrc?: string
  className?: string
  imgClassName?: string
  style?: CSSProperties
  imgStyle?: CSSProperties
  objectFit?: CSSProperties['objectFit']
  objectPosition?: CSSProperties['objectPosition']
}

/** Fixed-size box (prevents CLS) */
type FixedBox = {
  fill?: false
  width: number
  height: number
}
/** Fill parent like @/components/image `fill` */
type FillBox = {
  fill: true
  width?: never
  height?: never
}

/** Mode A: imagetools picture data */
type DataMode = BaseProps &
  (FixedBox | FillBox) & {
    data: PictureData
    src?: never
  }

/** Mode B: plain src (public/ or imported URL) */
type SrcMode = BaseProps &
  (FixedBox | FillBox) & {
    src: string
    data?: never
  }

export type ImageProps = DataMode | SrcMode

export function Image(props: ImageProps) {
  const {
    alt,
    sizes,
    priority,
    blurSrc,
    className,
    imgClassName,
    style,
    imgStyle,
    objectFit = 'cover',
    objectPosition,
  } = props

  const [loaded, setLoaded] = useState(false)

  const loading: ImgHTMLAttributes<HTMLImageElement>['loading'] = priority
    ? 'eager'
    : 'lazy'
  const fetchPriority: ImgHTMLAttributes<HTMLImageElement>['fetchPriority'] =
    priority ? 'high' : undefined

  const hasData = 'data' in props
  const pictureSources = hasData ? props.data?.sources || [] : []
  const imgSrc = hasData ? props.data?.img?.src || props.src : props.src
  const imgSrcSet = hasData ? props.data?.img?.srcset || undefined : undefined

  const wrapperStyle: CSSProperties = props.fill
    ? { position: 'relative', display: 'block', ...style }
    : {
        display: 'inline-block',
        aspectRatio:
          !props.fill && props.width && props.height
            ? `${props.width} / ${props.height}`
            : undefined,
        ...style,
      }

  const imgCommon: ImgHTMLAttributes<HTMLImageElement> = {
    alt,
    loading,
    decoding: 'async',
    fetchPriority,
    sizes,
    src: imgSrc!,
    srcSet: imgSrcSet,
    onLoad: () => setLoaded(true),
    className: imgClassName,
    style: {
      objectFit,
      objectPosition,
      ...(props.fill
        ? { position: 'absolute', inset: 0, width: '100%', height: '100%' }
        : undefined),
      ...imgStyle,
    },
  }

  return (
    <span
      className={className}
      style={{
        ...wrapperStyle,
        backgroundImage: blurSrc && !loaded ? `url(${blurSrc})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: blurSrc && !loaded ? 'blur(8px)' : undefined,
        transition: 'filter 200ms ease',
      }}
    >
      <picture>
        {pictureSources.map((s, i) => (
          <source key={i} type={s.type} srcSet={s.srcset} sizes={sizes} />
        ))}
        {props.fill ? (
          <img {...imgCommon} />
        ) : (
          <img {...imgCommon} width={props.width} height={props.height} />
        )}
      </picture>
    </span>
  )
}

export default Image
