import { Box, Button, Group, Image, rem, Text } from '@mantine/core'
import { Eye, UploadCloud } from 'lucide-react'
import { useRef, useState } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import Download from 'yet-another-react-lightbox/plugins/download'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'

export interface VerificationPreviewImage {
  url: string
  file: File
}
interface VerificationImagesUploadProps {
  images: VerificationPreviewImage[]
  addImages: (files: FileList | null) => void
  removeImage: (idx: number) => void
  disabled?: boolean
}

const MAX_IMAGES = 8

export default function VerificationImagesUpload({
  images,
  addImages,
  removeImage,
  disabled = false,
}: Readonly<VerificationImagesUploadProps>) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)

  return (
    <Box mb={32}>
      <Text fw={700} mb={8}>
        Carregue no máximo 8 fotos do ativo para fazer a verificação
      </Text>
      <Group mb={8}>
        <Button
          leftSection={<UploadCloud size={16} />}
          component="label"
          size="xs"
          color="var(--mantine-color-text)"
          radius="md"
          disabled={images.length >= MAX_IMAGES || disabled}
        >
          <span>Carregar imagens</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              addImages(e.target.files)
              if (inputRef.current) inputRef.current.value = ''
            }}
            data-testid="upload-input"
          />
        </Button>
      </Group>
      <Group>
        {images.map((img, idx) => (
          <Box
            key={img.url}
            style={{
              position: 'relative',
              display: 'inline-block',
              width: rem(90),
              height: rem(90),
              margin: rem(4),
              border: '1px solid var(--mantine-color-default-border)',
              borderRadius: rem(8),
              overflow: 'hidden',
              background: 'var(--mantine-color-default)',
            }}
          >
            <Image
              src={img.url}
              alt={`preview-${idx}`}
              width={rem(64)}
              height={rem(64)}
              radius={8}
              style={{ objectFit: 'cover', cursor: 'pointer' }}
              onClick={() => {
                setLightboxIndex(idx)
                setLightboxOpen(true)
              }}
            />
            <Button
              size="xs"
              color="red"
              radius="xl"
              style={{
                position: 'absolute',
                top: 2,
                right: 2,
                zIndex: 2,
                padding: 0,
                width: 18,
                height: 18,
              }}
              onClick={() => removeImage(idx)}
              disabled={disabled}
            >
              x
            </Button>
            <Button
              size="xs"
              color="gray"
              radius="xl"
              style={{
                position: 'absolute',
                bottom: 2,
                right: 2,
                zIndex: 2,
                padding: 0,
                width: 18,
                height: 18,
              }}
              onClick={() => {
                setLightboxIndex(idx)
                setLightboxOpen(true)
              }}
            >
              <Eye size={12} />
            </Button>
          </Box>
        ))}
      </Group>
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={images.map((img) => ({ src: img.url }))}
        index={lightboxIndex}
        plugins={[Download, Zoom]}
        zoom={{ maxZoomPixelRatio: 2 }}
        carousel={{ finite: true }}
      />
    </Box>
  )
}
