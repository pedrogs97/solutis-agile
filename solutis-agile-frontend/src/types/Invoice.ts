import { type Asset } from './Asset'

export interface Invoice {
  id: number
  number: string
  totalValue: number
  totalAssets: number
  path: string | null
  file_name: string
  assets: Asset[] | []
}
