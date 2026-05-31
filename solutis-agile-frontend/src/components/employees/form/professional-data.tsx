import { Grid } from '@mantine/core'
import { IMaskInput } from 'react-imask'

import DatePicker from '@/components/common/date-input'
import Input from '@/components/common/input'
import Select from '@/components/common/select'
import Textarea from '@/components/common/textarea'

interface ProfessionalDataProps {
  form: any
  roles: any
  isPendingRoles: boolean
  isErrorRoles: any
  isEdit: boolean
  isPJ: boolean
  canEdit: boolean
  toPJ: boolean
}

export default function ProfessionalData({
  form,
  roles,
  isPendingRoles,
  isEdit,
  isPJ,
  canEdit,
  toPJ,
}: Readonly<ProfessionalDataProps>) {
  const isReadOnly = !isPJ && isEdit && !canEdit
  return (
    <>
      <Grid my={10}>
        <Grid.Col span={{ base: 12, xs: 2.5 }}>
          <Input
            label="Gestor Direto"
            placeholder={isEdit ? '' : 'Digite o Gestor Direto'}
            name="manager"
            readOnly={isReadOnly}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 4 }}>
          {isPJ ? (
            <Input
              label="Cargo"
              placeholder={isEdit ? '' : 'Digite o Cargo'}
              name="jobPosition"
              readOnly={isReadOnly}
            />
          ) : (
            <Select
              name="role"
              label="Cargo"
              placeholder={isEdit ? '' : 'Selecione o Cargo'}
              data={roles}
              loading={isPendingRoles}
              readOnly={isReadOnly}
            />
          )}
        </Grid.Col>
        {(isPJ || toPJ) && (
          <>
            <Grid.Col span={{ base: 8, xs: 2.5 }}>
              <DatePicker
                name="employerContractDate"
                label="Data de Início do Contrato"
                placeholder=""
                valueFormat="DD/MM/YYYY"
                readOnly={isReadOnly}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 8, xs: 2.5 }}>
              <DatePicker
                name="employerEndContractDate"
                label="Data de Término do Contrato"
                placeholder=""
                valueFormat="DD/MM/YYYY"
                minDate={form.watch('employerContractDate')}
                disabled={isReadOnly || !form.watch('employerContractDate')}
              />
            </Grid.Col>
          </>
        )}
      </Grid>
      {(isPJ || toPJ) && (
        <>
          <Grid my={10}>
            <Grid.Col span={{ base: 12, xs: 3 }}>
              <Input
                name="employerNumber"
                component={IMaskInput}
                label="CNPJ"
                placeholder={isEdit ? '' : 'Digite o CNPJ'}
                mask="00.000.000/0000-00"
                readOnly={isReadOnly}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, xs: 6 }}>
              <Input
                name="employerName"
                label="Razão Social"
                placeholder={isEdit ? '' : 'Digite a Razão Social'}
                readOnly={isReadOnly}
              />
            </Grid.Col>
            {isEdit && (
              <Grid.Col span={{ base: 12, xs: 3 }}>
                <Input name="registration" label="Matrícula" readOnly />
              </Grid.Col>
            )}
          </Grid>
          <Grid my={10}>
            <Grid.Col span={{ base: 12, xs: 6 }}>
              <Textarea
                label="Objeto do contrato"
                placeholder={isEdit ? '' : 'Digite o objeto do contrato'}
                name="employerContractObject"
                rows={7}
                maxLength={255}
                readOnly={isReadOnly}
              />
            </Grid.Col>
          </Grid>
        </>
      )}
    </>
  )
}
