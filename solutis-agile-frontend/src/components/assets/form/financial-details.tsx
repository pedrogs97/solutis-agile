'use client'
import {
  Button,
  Checkbox,
  Flex,
  Grid,
  NumberInput,
  TextInput,
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { ArrowLeft, Check } from 'lucide-react'
import { Controller } from 'react-hook-form'

import { Can } from '@/components/providers/ability'
import { type Asset } from '@/types/Asset'

interface FinancialDetailsProps {
  handleSubmit: Function
  onSubmit: Function
  asset: Asset | null | undefined
  control: any
  formState: { isSubmitting: boolean }
  hasInsurance: boolean
  setHasInsurance: Function
  setActiveTab: Function
  isEdit: boolean
}

export default function FinancialDetails(
  props: Readonly<FinancialDetailsProps>,
) {
  return (
    <form onSubmit={props.handleSubmit(props.onSubmit)}>
      <Grid my={10}>
        <Grid.Col span={{ base: 12, xs: 2 }}>
          <Controller
            control={props.control}
            name="acquisitionDate"
            render={({ field, fieldState }) => (
              <DateInput
                label="Data de Aquisição"
                valueFormat="DD/MM/YYYY"
                maxDate={new Date()}
                value={field.value ?? null}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                readOnly={props.asset?.byAgile === false && props.isEdit}
              />
            )}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 6 }}>
          <Controller
            control={props.control}
            name="supplier"
            render={({ field }) => (
              <TextInput
                label="Fornecedor"
                placeholder="Digite o fornecedor"
                {...field}
                value={field.value ?? ''}
                readOnly={props.asset?.byAgile === false && props.isEdit}
              />
            )}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 2 }}>
          <Controller
            control={props.control}
            name="value"
            render={({ field: { onChange, onBlur, value }, fieldState }) => (
              <NumberInput
                label="Valor de Aquisição"
                placeholder="Digite o valor"
                hideControls
                prefix="R$ "
                allowNegative={false}
                decimalScale={2}
                decimalSeparator=","
                thousandSeparator="."
                onChange={onChange}
                onBlur={onBlur}
                value={value}
                error={fieldState.error?.message}
                readOnly={props.asset?.byAgile === false && props.isEdit}
              />
            )}
          />
        </Grid.Col>
        {props.isEdit && (
          <Grid.Col span={{ base: 12, xs: 2 }}>
            <Controller
              control={props.control}
              name="depreciation"
              render={({ field }) => (
                <TextInput
                  label="Valor Residual"
                  disabled
                  {...field}
                  value={field.value ?? ''}
                />
              )}
            />
          </Grid.Col>
        )}
      </Grid>
      <Grid my={10}>
        <Grid.Col span={{ base: 12, xs: 4 }}>
          <Checkbox
            label={
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--mantine-color-dimmed)',
                }}
              >{`Possui garantia? ${props.hasInsurance ? 'Sim' : 'Não'}`}</span>
            }
            checked={props.hasInsurance}
            onChange={() => props.setHasInsurance(!props.hasInsurance)}
            readOnly={props.asset?.byAgile === false && props.isEdit}
          />
        </Grid.Col>
        {props.isEdit && (
          <Grid.Col span={{ base: 8, xs: 3 }}>
            <Controller
              name="invoiceNumber"
              control={props.control}
              render={({ field: { onChange, onBlur, value }, fieldState }) => (
                <TextInput
                  label="N° Nota Fiscal"
                  onChange={(event) => onChange(event.currentTarget.value)}
                  onBlur={onBlur}
                  error={fieldState.error?.message}
                  value={value ?? ''}
                  disabled
                />
              )}
            />
          </Grid.Col>
        )}
      </Grid>
      {props.hasInsurance && (props.asset?.byAgile || !props.isEdit) && (
        <Grid my={10}>
          <Grid.Col span={{ base: 12, xs: 4 }}>
            <Controller
              control={props.control}
              name="assuranceDate"
              render={({ field, fieldState }) => (
                <DateInput
                  label="Garantia"
                  placeholder="Selecione a data da garantia"
                  valueFormat="DD/MM/YYYY"
                  value={field.value ?? null}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  readOnly={props.asset?.byAgile === false && props.isEdit}
                />
              )}
            />
          </Grid.Col>
        </Grid>
      )}
      <Flex justify="space-between">
        <Button
          type="button"
          color="gray"
          variant="outline"
          radius="md"
          onClick={() => {
            props.setActiveTab('general-data')
          }}
        >
          <ArrowLeft size={16} />
          &nbsp;Voltar
        </Button>
        <Can I="edit" a="asset">
          <Button
            variant="outline"
            radius="md"
            type="submit"
            disabled={props.formState.isSubmitting}
            loading={props.formState.isSubmitting}
          >
            Salvar&nbsp;
            <Check size={16} />
          </Button>
        </Can>
      </Flex>
    </form>
  )
}
