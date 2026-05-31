import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

const createTestJwt = () => {
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
  ).toString('base64url')
  const payload = Buffer.from(
    JSON.stringify({
      sub: 'user-1',
      permissions: [
        'lending_lending_add',
        'lending_lending_view',
        'lending_lending_edit',
      ],
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    }),
  ).toString('base64url')
  return `${header}.${payload}.signature`
}

const TEST_JWT = createTestJwt()

const AUTH_STATE = {
  accessToken: TEST_JWT,
  refreshToken: 'refresh-token',
}

const PROFILE_STATE = {
  profile: {
    group: 'QA',
    email: 'qa.user@solutis.com',
    full_name: 'QA User',
    access_token: TEST_JWT,
    refresh_token: 'refresh-token',
    token_type: 'Bearer',
    expires_in: 3600,
    permissions: [
      'lending_lending_add',
      'lending_lending_view',
      'lending_lending_edit',
    ],
  },
  hasHydrated: true,
}

const EMPLOYEE_FIXTURE = {
  items: [
    {
      id: 1,
      fullName: 'Ana Maria',
      email: 'ana.maria@solutis.com',
    },
    {
      id: 2,
      fullName: 'Bruno Lima',
      email: 'bruno.lima@solutis.com',
    },
    {
      id: 3,
      fullName: 'Carla Testemunha',
      email: 'carla@testemunha.com',
    },
    {
      id: 4,
      fullName: 'Daniel Testemunha',
      email: 'daniel@testemunha.com',
    },
  ],
}

const ASSET_FIXTURE = {
  items: [
    {
      id: 10,
      registerNumber: 'NB-001',
      imei: '',
      type: {
        id: 99,
        name: 'Notebook',
      },
    },
  ],
}

const VERIFICATION_FIXTURE = [
  {
    id: 200,
    assetType: 'Notebook',
    assetTypeId: 99,
    category: 'Checklist Inicial',
    categoryId: 1,
    question: 'Equipamento está em perfeitas condições?',
    step: 'Checklist',
    options: ['Sim', 'Não'],
  },
]

const COST_CENTER_FIXTURE = [
  {
    id: 501,
    name: 'Centro Corporativo',
    code: '100',
  },
]

const WORKLOAD_FIXTURE = [
  {
    id: 701,
    name: 'Equipe Operacional',
  },
]

const CREATE_LENDING_SUCCESS_RESPONSE = {
  lending: {
    id: '123',
    employee: { legalPerson: false },
  },
  document: {
    id: 555,
  },
  verfication: [],
}

async function mockApiRoutes(page: Page) {
  await page.route('**/api/v1/people/center-cost/**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue()
      return
    }
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(COST_CENTER_FIXTURE),
    })
  })

  await page.route('**/api/v1/lendings-workloads/**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue()
      return
    }
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(WORKLOAD_FIXTURE),
    })
  })

  await page.route('**/api/v1/verifications/1/**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue()
      return
    }
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VERIFICATION_FIXTURE),
    })
  })

  await page.route('**/api/v1/people/employees-select/**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue()
      return
    }
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(EMPLOYEE_FIXTURE),
    })
  })

  await page.route('**/api/v1/assets-select/**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue()
      return
    }
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ASSET_FIXTURE),
    })
  })

  await page.route('**/api/v2/lendings/**', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue()
      return
    }
    await route.fulfill({
      status: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(CREATE_LENDING_SUCCESS_RESPONSE),
    })
  })
}

async function fillRequiredForm(page: Page) {
  const employeeCombobox = page.getByRole('textbox', { name: 'Colaborador' })
  await employeeCombobox.click()
  await employeeCombobox.fill('An')
  await page.getByRole('option', { name: 'Ana Maria' }).first().click()

  await page.getByLabel('Gestor').fill('Carlos Gestor')

  const workloadCombobox = page.getByRole('textbox', { name: 'Lotação' })
  await workloadCombobox.click()
  await page.getByRole('option', { name: 'Equipe Operacional' }).first().click()

  const costCenterCombobox = page.getByRole('textbox', {
    name: 'Centro de custo',
  })
  await costCenterCombobox.click()
  await page
    .getByRole('option', { name: 'Centro Corporativo - 100' })
    .first()
    .click()

  const assetCombobox = page.getByRole('textbox', { name: 'Ativo' })
  await assetCombobox.click()
  await assetCombobox.fill('NB')
  await page
    .getByRole('option', { name: /NB-001/ })
    .first()
    .click()

  const buCombobox = page.getByRole('textbox', { name: 'BU' })
  await buCombobox.click()
  await page.getByRole('option', { name: 'ADS' }).first().click()

  await page.getByLabel('Projeto').fill('Projeto Observatório')
  await page.getByLabel('Número GLPI').fill('GLPI-321')
  await page.getByLabel('Executivo').fill('Executivo Teste')

  const locationCombobox = page.getByRole('textbox', {
    name: 'Origem do Contrato',
  })
  await locationCombobox.click()
  await page.getByRole('option', { name: 'Salvador - BA' }).click()

  const witnessOneCombobox = page.getByRole('textbox', {
    name: 'Testemunha 1',
  })
  await witnessOneCombobox.click()
  await witnessOneCombobox.fill('Ca')
  await page.getByRole('option', { name: 'Carla Testemunha' }).click()

  const witnessTwoCombobox = page.getByRole('textbox', {
    name: 'Testemunha 2',
  })
  await witnessTwoCombobox.click()
  await witnessTwoCombobox.fill('Da')
  await page.getByRole('option', { name: 'Daniel Testemunha' }).click()

  const principalCombobox = page.getByRole('textbox', { name: 'Comodante' })
  await principalCombobox.click()
  await page.getByRole('option', { name: 'Beatriz Cunha' }).click()

  await page
    .getByLabel('Observação')
    .fill('Contrato criado via teste automatizado.')
}

async function navigateToConfirmationModal(page: Page) {
  await fillRequiredForm(page)

  await page.getByRole('button', { name: /Próximo/ }).click()
  await expect(page.getByText('Anexos do Comodato')).toBeVisible()

  const contractNextButton = page
    .locator('button')
    .filter({ hasText: 'Próximo' })
    .last()
  await contractNextButton.click()

  await expect(page.getByText('Verificação do equipamento')).toBeVisible()
  await page.getByRole('radio', { name: 'Sim' }).first().check()
  await page.getByRole('button', { name: 'Enviar verificação' }).click()

  await expect(page.getByText('Confirmação de dados')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Confirmar envio' }),
  ).toBeVisible()
}

test.describe('Add lending flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      async ({ token, authState, profileState }) => {
        localStorage.clear()

        const authPersist = { state: authState, version: 0 }
        const profilePersist = {
          state: {
            profile: profileState.profile,
            hasHydrated: profileState.hasHydrated,
          },
          version: 0,
        }

        localStorage.setItem('auth-store', JSON.stringify(authPersist))
        localStorage.setItem('profile-store', JSON.stringify(profilePersist))
        localStorage.setItem('accessToken', token)
        localStorage.setItem('refreshToken', authState.refreshToken)

        try {
          const [{ useProfileStore }, { useAuthStore }] = await Promise.all([
            import('/src/store/persisted/useProfileStore.ts'),
            import('/src/store/persisted/useAuthStore.ts'),
          ])

          useProfileStore.setState(() => ({
            profile: profileState.profile,
            hasHydrated: profileState.hasHydrated,
          }))

          useAuthStore.setState(() => ({
            accessToken: authState.accessToken,
            refreshToken: authState.refreshToken,
          }))
        } catch (error) {
          console.error('Playwright setup failed to prime stores', error)
        }
      },
      {
        token: TEST_JWT,
        authState: AUTH_STATE,
        profileState: PROFILE_STATE,
      },
    )

    await mockApiRoutes(page)
  })

  test('user can create a lending contract', async ({ page }) => {
    await page.goto('/lendings/add')
    if (page.url().includes('/dashboard')) {
      await page.waitForTimeout(200)
      await page.goto('/lendings/add')
    }
    await page.waitForURL(/\/lendings\/add\/?$/)

    await expect(page.getByText('Novo contrato', { exact: true })).toBeVisible()
    await navigateToConfirmationModal(page)
    const confirmButton = page.getByRole('button', { name: 'Confirmar envio' })

    const createLendingResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes('/api/v2/lendings/'),
    )

    await Promise.all([createLendingResponse, confirmButton.click()])

    await expect(page).toHaveURL(/\/lendings\/edit\/123$/)
  })

  test('shows validation error notification and does not render server-error page on 400', async ({
    page,
  }) => {
    await page.route('**/api/v2/lendings/**', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue()
        return
      }
      await route.fulfill({
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          detail: [
            {
              field: 'attachments',
              error:
                'Arquivo de anexo não encontrado para geração do contrato.',
            },
          ],
        }),
      })
    })

    await page.goto('/lendings/add')
    await page.waitForURL(/\/lendings\/add\/?$/)
    await expect(page.getByText('Novo contrato', { exact: true })).toBeVisible()

    await navigateToConfirmationModal(page)
    const confirmButton = page.getByRole('button', { name: 'Confirmar envio' })

    const createLendingResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes('/api/v2/lendings/') &&
        response.status() === 400,
    )

    await Promise.all([createLendingResponse, confirmButton.click()])

    await expect(page).toHaveURL(/\/lendings\/add\/?$/)
    await expect(
      page.getByText(
        'Arquivo de anexo não encontrado para geração do contrato.',
      ),
    ).toBeVisible()
    await expect(page.getByText('Ocorreu um erro...')).toHaveCount(0)
  })
})
