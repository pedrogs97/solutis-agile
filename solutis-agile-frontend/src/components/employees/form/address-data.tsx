import { Grid } from '@mantine/core'
import { IMaskInput } from 'react-imask'

import Input from '@/components/common/input'

interface AddressDataProps {
  form: any
  isEdit: boolean
  isPJ: boolean
  canEdit: boolean
}

export default function AddressData({
  form,
  isEdit,
  isPJ,
  canEdit,
}: Readonly<AddressDataProps>) {
  const isReadOnly = !isPJ && isEdit && !canEdit

  return (
    <>
      <Grid my={10}>
        <Grid.Col span={{ base: 12, xs: 3 }}>
          <Input
            name="address.postalCode"
            label="CEP"
            placeholder="Digite o CEP"
            component={IMaskInput}
            mask="00000-000"
            readOnly={isReadOnly}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 3 }}>
          <Input
            label="Bairro"
            placeholder="Digite o Bairro"
            name="address.neighbourhood"
            readOnly={isReadOnly}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 3 }}>
          <Input
            label="Cidade"
            placeholder="Digite a Cidade"
            name="address.city"
            readOnly={isReadOnly}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 3 }}>
          <Input
            label="Estado"
            placeholder="Selecione o Estado"
            name="address.state"
            error={form?.formState?.errors?.address?.state?.message}
            readOnly={isReadOnly}
          />
        </Grid.Col>
      </Grid>
      <Grid my={10}>
        <Grid.Col span={{ base: 12, xs: 6 }}>
          <Input
            label="Rua/Logradouro"
            placeholder="Digite a rua/Logradouro"
            name="address.street"
            error={form?.formState?.errors?.address?.street?.message}
            readOnly={isReadOnly}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 1 }}>
          <Input
            label="Número"
            placeholder="Nº"
            name="address.number"
            error={form?.formState?.errors?.address?.number?.message}
            readOnly={isReadOnly}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 5 }}>
          <Input
            label="Complemento"
            placeholder="Digite o complemento"
            name="address.complement"
            error={form?.formState?.errors?.address?.complement?.message}
            readOnly={isReadOnly}
          />
        </Grid.Col>
      </Grid>
    </>
  )
}
