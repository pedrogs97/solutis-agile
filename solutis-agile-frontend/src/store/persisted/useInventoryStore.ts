import { create } from 'zustand'

export interface LendingInventory {
  id: number
  assetDescription: string
  registerNumber: string
  serialNumber: string
  msOffice: boolean
  executive: string
  location: string
  costCenter: string
  bu: string
}

export interface InventoryLendingItemsIncorrectInteface {
  id: number
  assetDescription: string
  confirm: boolean
  justification: string
}

interface InventoryLendingItemIterface {
  lendingId: number
  confirm: boolean
  justification: string
}

export interface TermInventory {
  id: number
  description: string
  size: string
  quantity: number
  value: number
  operator: string
  lineNumber: string
  type: string
}

interface InventoryTermItemIterface {
  termId: number
  confirm: boolean
  justification: string
}

export interface InventoryTermItemsIncorrectInteface {
  id: number
  description: string
  confirm: boolean
  justification: string
}

interface EmployeeInventory {
  fullName: string
  manager: string
  phone: string
  email: string
  lendings: LendingInventory[]
  terms: TermInventory[]
}

interface Inventory {
  token: string
  employee: EmployeeInventory
}

export interface InventoryExtraLending {
  registerNumber: string
  description: string
  serialNumber: string
}

export interface InventoryView {
  year: string
  employee: {
    email: string
    fullName: string
    phone: string
    registration: string
    manager: string
  }
  extraAssets: {
    id: number
    description: string
    registerNumber: string
    serialNumber: string
  }[]
  extraItems: {
    extraItems: string
  }[]
  lendings: {
    id: number
    assetDescription: string
    registerNumber: string
    serialNumber: string
    msOffice: boolean
    executive: string
    location: string
    costCenter: string
    bu: string
    justification: string
    confirm: boolean
  }[]
  terms: {
    id: number
    description: string
    size: string
    quantity: number
    value: number
    operator: string
    lineNumber: string
    type: string
    justification: string
    confirm: boolean
  }[]
}

interface InventoryState {
  inventory: Inventory | null
  updateInventory: (inventory: Inventory | undefined) => void
  resetInventory: () => void

  lendingIncorrects: InventoryLendingItemsIncorrectInteface[]
  addLendingIncorrect: (newItem: InventoryLendingItemsIncorrectInteface) => void
  removeLendingIncorrect: (id: number) => void
  updateLendingIncorrect: (
    newItem: InventoryLendingItemsIncorrectInteface,
    id: number,
  ) => void

  inventoryLendingItems: InventoryLendingItemIterface[]
  addLendingInventory: (newItem: InventoryLendingItemIterface) => void
  removeLendingInventory: (id: number) => void
  updateLendingInventory: (
    newItem: InventoryLendingItemIterface,
    id: number,
  ) => void

  invertoryExtraLendings: InventoryExtraLending[]
  addExtraLending: (newItem: InventoryExtraLending) => void
  removeExtraLending: (registerNumber: string) => void
  updateExtraLending: (
    newItem: InventoryExtraLending,
    registerNumber: string,
  ) => void

  termIncorrects: InventoryTermItemsIncorrectInteface[]
  addTermIncorrect: (newItem: InventoryTermItemsIncorrectInteface) => void
  removeTermIncorrect: (id: number) => void
  updateTermIncorrect: (
    newItem: InventoryTermItemsIncorrectInteface,
    id: number,
  ) => void

  inventoryTermItems: InventoryTermItemIterface[]
  addTermInventory: (newItem: InventoryTermItemIterface) => void
  removeTermInventory: (id: number) => void
  updateTermInventory: (newItem: InventoryTermItemIterface, id: number) => void

  inventoryExtraItems: string
  updateInventoryExtraItems: (value: string) => void

  invetoryToView: InventoryView | null
  updateInventoryToView: (inventory: InventoryView | null) => void
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  inventory: null,
  updateInventory: (inventory: Inventory | undefined) =>
    set({ inventory: inventory }),
  resetInventory: () => set({ inventory: undefined }),

  lendingIncorrects: [],
  inventoryLendingItems: [],
  invertoryExtraLendings: [],
  addLendingInventory: (newItem: InventoryLendingItemIterface) =>
    set({ inventoryLendingItems: [...get().inventoryLendingItems, newItem] }),
  removeLendingInventory: (id: number) =>
    set({
      inventoryLendingItems: get().inventoryLendingItems.filter(
        (item) => item.lendingId !== id,
      ),
    }),
  updateLendingInventory: (newItem: InventoryLendingItemIterface, id: number) =>
    set({
      inventoryLendingItems: get().inventoryLendingItems.map((item) =>
        item.lendingId === id ? newItem : item,
      ),
    }),
  addLendingIncorrect: (newItem: InventoryLendingItemsIncorrectInteface) =>
    set({ lendingIncorrects: [...get().lendingIncorrects, newItem] }),
  removeLendingIncorrect: (id: number) =>
    set({
      lendingIncorrects: get().lendingIncorrects.filter(
        (item) => item.id !== id,
      ),
    }),
  updateLendingIncorrect: (
    newItem: InventoryLendingItemsIncorrectInteface,
    id: number,
  ) =>
    set({
      lendingIncorrects: get().lendingIncorrects.map((item) =>
        item.id === id ? newItem : item,
      ),
    }),
  addExtraLending: (newItem: InventoryExtraLending) =>
    set({ invertoryExtraLendings: [...get().invertoryExtraLendings, newItem] }),
  removeExtraLending: (registerNumber: string) =>
    set({
      invertoryExtraLendings: get().invertoryExtraLendings.filter(
        (item) => item.registerNumber !== registerNumber,
      ),
    }),
  updateExtraLending: (
    newItem: InventoryExtraLending,
    registerNumber: string,
  ) =>
    set({
      invertoryExtraLendings: get().invertoryExtraLendings.map((item) =>
        item.registerNumber === registerNumber ? newItem : item,
      ),
    }),

  termIncorrects: [],
  inventoryTermItems: [],
  inventoryExtraItems: '',
  addTermInventory: (newItem: InventoryTermItemIterface) =>
    set({ inventoryTermItems: [...get().inventoryTermItems, newItem] }),
  removeTermInventory: (id: number) =>
    set({
      inventoryTermItems: get().inventoryTermItems.filter(
        (item) => item.termId !== id,
      ),
    }),
  updateTermInventory: (newItem: InventoryTermItemIterface, id: number) =>
    set({
      inventoryTermItems: get().inventoryTermItems.map((item) =>
        item.termId === id ? newItem : item,
      ),
    }),
  addTermIncorrect: (newItem: InventoryTermItemsIncorrectInteface) =>
    set({ termIncorrects: [...get().termIncorrects, newItem] }),
  removeTermIncorrect: (id: number) =>
    set({
      termIncorrects: get().termIncorrects.filter((item) => item.id !== id),
    }),
  updateTermIncorrect: (
    newItem: InventoryTermItemsIncorrectInteface,
    id: number,
  ) =>
    set({
      termIncorrects: get().termIncorrects.map((item) =>
        item.id === id ? newItem : item,
      ),
    }),
  updateInventoryExtraItems: (value: string) =>
    set({ inventoryExtraItems: value }),

  invetoryToView: null,
  updateInventoryToView: (inventory: InventoryView | null) =>
    set({ invetoryToView: inventory }),
}))
