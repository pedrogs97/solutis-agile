'use client'

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

interface Bank {
  code: string
  name: string
  ispb: string
  fullName: string
}

export interface BankOption {
  value: string
  label: string
  bankCode: string
  bankName: string
}

export const useBankOptions = (enabled = true) => {
  const fetchBanks = async (): Promise<BankOption[]> => {
    try {
      const response = await axios.get<Bank[]>(
        'https://brasilapi.com.br/api/banks/v1',
      )
      const uniqueBanks = response.data.filter(
        (bank, index, self) =>
          index === self.findIndex((b) => b.fullName === bank.fullName),
      )
      return uniqueBanks.map((bank) => ({
        value: bank.code ? String(bank.code) : bank.fullName,
        label: `${bank.code ? `${bank.code} - ` : ''}${bank.fullName}`,
        bankCode: bank.code ? String(bank.code) : bank.fullName,
        bankName: bank.fullName,
      }))
    } catch (error) {
      console.error('Failed to fetch banks:', error)
      return []
    }
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['bankOptions'],
    queryFn: fetchBanks,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    enabled,
  })

  return {
    bankOptions: data || [],
    isLoading,
    error,
  }
}
