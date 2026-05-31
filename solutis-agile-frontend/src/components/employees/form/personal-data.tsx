import { Grid, SimpleGrid, Switch as SwitchMantine } from '@mantine/core'
import { Controller } from 'react-hook-form'
import { IMaskInput } from 'react-imask'

import DatePicker from '@/components/common/date-input'
import Input from '@/components/common/input'
import Select from '@/components/common/select'
import Switch from '@/components/common/switch'

interface PersonalDataProps {
  form: any
  nationalities: any
  isPendingNationality: boolean
  maritalStatus: any
  isPendingMaritalStatus: boolean
  genders: any
  isPendingGenders: boolean
  educationalLevels: any
  isPendingEducationalLevels: boolean
  isEdit: boolean
  isPJ: boolean
  canEdit: boolean
}

export default function PersonalData({
  form,
  nationalities,
  isPendingNationality,
  maritalStatus,
  isPendingMaritalStatus,
  genders,
  isPendingGenders,
  educationalLevels,
  isPendingEducationalLevels,
  isEdit,
  isPJ,
  canEdit,
}: Readonly<PersonalDataProps>) {
  const rgMask = [{ mask: '00.000.000-0' }, { mask: '00.000.000-00' }]
  const isReadOnly = !isPJ && isEdit && !canEdit
  const switchFields = [
    { name: 'hasSolutisAsset', label: 'Tem Equipamento Solutis' },
    { name: 'hasPersonalAsset', label: 'Tem Equipamento Pessoal' },
    { name: 'hasOtherAsset', label: 'Tem Equipamento de Terceiros' },
    ...(!isPJ ? [{ name: 'toLegalPerson', label: 'Habilitar como PJ' }] : []),
  ]

  return (
    <>
      <Grid my={10}>
        <Grid.Col span={{ base: 12, xs: 6 }}>
          <Input
            name="fullName"
            label="Nome do Colaborador"
            placeholder={isEdit ? '' : 'Digite o nome do colaborador'}
            readOnly={isReadOnly}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 3 }}>
          <Input
            name="taxpayerIdentification"
            label="CPF"
            placeholder={isEdit ? '' : 'Digite o CPF'}
            mask="000.000.000-00"
            component={IMaskInput}
            readOnly={isReadOnly}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 3 }}>
          <Input
            name="nationalIdentification"
            label="RG"
            placeholder={isEdit ? '' : 'Digite o RG'}
            mask={rgMask}
            component={IMaskInput}
            readOnly={isReadOnly}
          />
        </Grid.Col>
      </Grid>
      <Grid mb={20}>
        <Grid.Col span={{ base: 12, xs: 3 }}>
          <DatePicker
            name="birthday"
            label="Data de Nascimento"
            placeholder={isEdit ? '' : 'Selecione a data de nascimento'}
            readOnly={isReadOnly}
            maxDate={
              new Date(new Date().setFullYear(new Date().getFullYear() - 14))
            }
            valueFormat="DD/MM/YYYY"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 3 }}>
          <Select
            name="nationalityId"
            label="Nacionalidade"
            placeholder={isEdit ? '' : 'Selecione a nacionalidade'}
            data={nationalities}
            readOnly={isReadOnly}
            loading={isPendingNationality}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 3 }}>
          <Select
            name="maritalStatusId"
            label="Estado Civil"
            placeholder={isEdit ? '' : 'Selecione o estado civil'}
            data={maritalStatus}
            readOnly={isReadOnly}
            loading={isPendingMaritalStatus}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 3 }}>
          <Select
            name="genderId"
            label="Gênero"
            placeholder={isEdit ? '' : 'Selecione o gênero'}
            data={genders}
            readOnly={isReadOnly}
            loading={isPendingGenders}
          />
        </Grid.Col>
      </Grid>
      <Grid my={10}>
        <Grid.Col span={{ base: 12, xs: 4 }}>
          <Select
            name="educationalLevelId"
            label="Grau de Escolaridade"
            placeholder={isEdit ? '' : 'Selecione o grau de escolaridade'}
            data={educationalLevels}
            readOnly={isReadOnly}
            loading={isPendingEducationalLevels}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 5 }}>
          <Input
            name="email"
            label="E-mail Pessoal"
            placeholder={isEdit ? '' : 'Digite o E-mail Pessoal'}
            readOnly={isReadOnly}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 3 }}>
          <Input
            name="cellPhone"
            label="Telefone Pessoal"
            placeholder={isEdit ? '' : 'Digite o Telefone Pessoal'}
            mask="(00) 00000-0000"
            component={IMaskInput}
            readOnly={isReadOnly}
          />
        </Grid.Col>
        {isEdit && (
          <Grid.Col span={{ base: 12 }}>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
              <Controller
                name="status"
                control={form.control}
                render={({ field }) => {
                  const isActive = field.value === 'Ativo'
                  return (
                    <SwitchMantine
                      label="Situação"
                      description={isActive ? 'Ativo' : 'Inativo'}
                      color={isActive ? 'green' : 'red'}
                      checked={isActive}
                      onChange={(event) =>
                        field.onChange(
                          event.currentTarget.checked ? 'Ativo' : 'Inativo',
                        )
                      }
                      error={form.formState.errors?.status?.message}
                      disabled={isReadOnly}
                      readOnly={isReadOnly}
                    />
                  )
                }}
              />
              {switchFields.map(({ name, label }) => (
                <Switch
                  key={name}
                  name={name}
                  label={label}
                  disabled={isReadOnly}
                />
              ))}
            </SimpleGrid>
          </Grid.Col>
        )}
      </Grid>
    </>
  )
}
