import { Badge } from '@mantine/core'
import { FileCheck, FileClock, FileQuestion, FileX2 } from 'lucide-react'

// Lending

export const getLendingBadgeFromStatus = (status: string | undefined) => {
  if (!status) return <Badge color={'gray'} size="xs" circle mr={5} />
  switch (status) {
    case 'Ativo':
      return <Badge color={'green'} size="xs" circle mr={5} />
    case 'Arquivo pendente':
      return <Badge color={'yellow'} size="xs" circle mr={5} />
    case 'Arquivo de distrato pendente':
      return <Badge color={'orange'} size="xs" circle mr={5} />
    case 'Distrato realizado':
      return <Badge color={'indigo'} size="xs" circle mr={5} />
    default:
      return <Badge color={'gray'} size="xs" circle mr={5} />
  }
}

export const getLendingIconFromStatus = (status: string | undefined) => {
  if (!status) return <FileQuestion />
  switch (status) {
    case 'Ativo':
      return <FileCheck />
    case 'Arquivo pendente':
      return <FileClock />
    case 'Arquivo de distrato pendente':
      return <FileClock />
    case 'Distrato realizado':
      return <FileX2 />
    default:
      return <FileQuestion />
  }
}

export const getLendingColorFromStatus = (status: string | undefined) => {
  if (!status) return 'gray'
  switch (status) {
    case 'Ativo':
      return 'green'
    case 'Arquivo pendente':
      return 'yellow'
    case 'Arquivo de distrato pendente':
      return 'orange'
    case 'Distrato realizado':
      return 'indigo'
    default:
      return 'gray'
  }
}

// Maintenances and Upgrade

export const getStatusService = (status: string | undefined) => {
  if (!status) return <Badge color={'gray'} size="xs" circle mr={5} />
  switch (status) {
    case 'Finalizado':
      return <Badge color={'green'} size="xs" circle mr={5} />
    case 'Pendente':
      return <Badge color={'yellow'} size="xs" circle mr={5} />
    case 'Em progresso':
      return <Badge color={'orange'} size="xs" circle mr={5} />
    case 'Inativo':
      return <Badge color={'red'} size="xs" circle mr={5} />
    default:
      return <Badge color={'gray'} size="xs" circle mr={5} />
  }
}

export const getIconFromStatus = (status: string | undefined) => {
  if (!status) return <FileClock />
  switch (status) {
    case 'Finalizado':
      return <FileCheck />
    case 'Pendente':
      return <FileX2 />
    case 'Em progresso':
      return <FileClock />
    case 'Inativo':
      return <FileX2 />
    default:
      return <FileClock />
  }
}

export const getColorFromStatus = (status: string | undefined) => {
  if (!status) return 'gray'
  switch (status) {
    case 'Finalizado':
      return 'green'
    case 'Pendente':
      return 'yellow'
    case 'Em progresso':
      return 'orange'
    case 'Inativo':
      return 'red'
    default:
      return 'gray'
  }
}
