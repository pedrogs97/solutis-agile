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
        'supplier_supplier_add',
        'supplier_supplier_view',
        'supplier_supplier_edit',
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
      'supplier_supplier_add',
      'supplier_supplier_view',
      'supplier_supplier_edit',
    ],
  },
  hasHydrated: true,
}

async function mockApiRoutes(page: Page) {
  // Catch-all mock for domain and config calls
  await page.route('**/api/v1/domain/classifications/**', async (route) => {
    await route.fulfill({
      status: 200,
      json: [{ id: 1, name: 'Classificação Teste' }],
    })
  })
  await page.route('**/api/v1/domain/categories/**', async (route) => {
    await route.fulfill({
      status: 200,
      json: [{ id: 2, name: 'Categoria Teste' }],
    })
  })
  await page.route('**/api/v1/domain/risk-levels/**', async (route) => {
    await route.fulfill({ status: 200, json: [{ id: 3, name: 'Baixo' }] })
  })
  await page.route('**/api/v1/domain/supplier-types/**', async (route) => {
    await route.fulfill({
      status: 200,
      json: [{ id: 4, name: 'Pessoa Jurídica' }],
    })
  })
  await page.route('**/api/v1/domain/supplier-situations/**', async (route) => {
    await route.fulfill({
      status: 200,
      json: [{ id: 5, name: 'Ativo', status: { id: 5 } }],
    })
  })
  await page.route('**/api/v1/domain/pix-types/**', async (route) => {
    await route.fulfill({
      status: 200,
      json: [{ id: 6, name: 'Chave Aleatória' }],
    })
  })
  await page.route('**/api/v1/domain/payment-methods/**', async (route) => {
    await route.fulfill({ status: 200, json: [{ id: 7, name: 'PIX' }] })
  })
  await page.route('**/api/v1/domain/payer-types/**', async (route) => {
    await route.fulfill({ status: 200, json: [] })
  })
  await page.route('**/api/v1/domain/business-sectors/**', async (route) => {
    await route.fulfill({ status: 200, json: [{ id: 9, name: 'Tecnologia' }] })
  })
  await page.route('**/api/v1/domain/company-sizes/**', async (route) => {
    await route.fulfill({ status: 200, json: [{ id: 10, name: 'Grande' }] })
  })
  await page.route('**/api/v1/domain/customer-types/**', async (route) => {
    await route.fulfill({ status: 200, json: [] })
  })
  await page.route(
    '**/api/v1/domain/taxpayer-classifications/**',
    async (route) => {
      await route.fulfill({ status: 200, json: [] })
    },
  )
  await page.route('**/api/v1/domain/taxation-regimes/**', async (route) => {
    await route.fulfill({ status: 200, json: [] })
  })
  await page.route('**/api/v1/domain/taxation-methods/**', async (route) => {
    await route.fulfill({ status: 200, json: [] })
  })
  await page.route('**/api/v1/domain/icms-taxpayers/**', async (route) => {
    await route.fulfill({ status: 200, json: [] })
  })
  await page.route('**/api/v1/domain/withholding-taxes/**', async (route) => {
    await route.fulfill({ status: 200, json: [] })
  })
  await page.route('**/api/v1/domain/iss-withholdings/**', async (route) => {
    await route.fulfill({ status: 200, json: [] })
  })
  await page.route('**/api/v1/domain/iss-regimes/**', async (route) => {
    await route.fulfill({ status: 200, json: [] })
  })
  await page.route('**/api/v1/domain/income-types/**', async (route) => {
    await route.fulfill({ status: 200, json: [] })
  })
  await page.route('**/api/v1/domain/public-entities/**', async (route) => {
    await route.fulfill({ status: 200, json: [] })
  })
  await page.route('**/api/v1/people/marital-status/**', async (route) => {
    await route.fulfill({ status: 200, json: [] })
  })
  await page.route('**/api/v1/people/nationalities/**', async (route) => {
    await route.fulfill({ status: 200, json: [] })
  })
  await page.route('**/api/v1/people/roles/**', async (route) => {
    await route.fulfill({ status: 200, json: [] })
  })
  await page.route('**/api/v1/people/genders/**', async (route) => {
    await route.fulfill({ status: 200, json: [] })
  })
  await page.route('**/api/v1/people/educational-level/**', async (route) => {
    await route.fulfill({ status: 200, json: [] })
  })
  await page.route('**/api/v1/people/center-cost/**', async (route) => {
    await route.fulfill({ status: 200, json: [] })
  })
  await page.route('**/api/v1/lendings-workloads/**', async (route) => {
    await route.fulfill({ status: 200, json: [] })
  })

  // Mock viacep
  await page.route('https://viacep.com.br/ws/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        logradouro: 'Rua de Teste',
        bairro: 'Bairro de Teste',
        localidade: 'Recife',
        uf: 'PE',
      }),
    })
  })
}

test.describe('Supplier payment date E2E validation', () => {
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

  test('should allow saving non-date text in payment date field', async ({
    page,
  }) => {
    // 1. Go to suppliers add page
    await page.goto('/suppliers/add')
    if (page.url().includes('/dashboard')) {
      await page.waitForTimeout(200)
      await page.goto('/suppliers/add')
    }
    await page.waitForURL(/\/suppliers\/add\/?$/)

    // Verify page header
    await expect(page.getByText('Novo Fornecedor')).toBeVisible()

    // 2. Fill General Data (Tab 1)
    // Select Nivel de Risco
    const riskLevelSelect = page.locator(
      'input[placeholder="Selecione o nível de risco"]',
    )
    await riskLevelSelect.click()
    await page.getByRole('option', { name: 'Baixo' }).first().click()

    // Razão Social
    await page
      .getByPlaceholder('Digite a razão social')
      .fill('Fornecedor Teste E2E')

    // CPF/CNPJ
    await page
      .getByPlaceholder('000.000.000-00 ou 00.000.000/0000-00')
      .fill('12.345.678/0001-95')

    // CEP (fills other fields automatically)
    await page.getByPlaceholder('00000-000').fill('50000-000')
    // Wait for address autofill
    await expect(page.getByPlaceholder('Rua, Avenida, etc.')).toHaveValue(
      'Rua de Teste',
    )

    // Numero
    await page.getByPlaceholder('Digite o número').fill('123')

    // Contato
    await page.getByPlaceholder('Informe o nome de contato').fill('Contato E2E')

    // Telefone
    await page.getByPlaceholder('(00) 00000-0000').fill('81999999999')

    // Next step
    await page.getByRole('button', { name: /Próximo/ }).click()

    // 3. Fill Additional Data (Tab 2)
    await expect(page.getByText('Dados do Contrato')).toBeVisible()

    // Payment Date - Fill free text
    const paymentDateInput = page.getByLabel('Data de Pagamento')
    await paymentDateInput.fill('05 de cada mês')

    // Next step
    await page.getByRole('button', { name: /Próximo/ }).click()

    // 4. Attachments (Tab 3)
    await expect(page.getByText('Anexar Arquivos')).toBeVisible()
    await page.getByRole('button', { name: /Próximo/ }).click()

    // 5. Responsibility Matrix (Tab 4) - Final step
    await expect(page.getByText('Matriz de Responsabilidade')).toBeVisible()

    // Mock create supplier POST call
    let requestPayload: any = null
    await page.route('**/api/v1/suppliers/', async (route) => {
      if (route.request().method() === 'POST') {
        requestPayload = route.request().postDataJSON()
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 123 }),
        })
      } else {
        await route.continue()
      }
    })

    // Click "Criar Fornecedor"
    await page.getByRole('button', { name: 'Criar Fornecedor' }).click()

    // Wait for the POST request to be triggered
    await page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes('/api/v1/suppliers/'),
    )

    // Assert request payload contains correct paymentDate string
    expect(requestPayload).not.toBeNull()
    expect(requestPayload.paymentDetails).toBeDefined()
    expect(requestPayload.paymentDetails.paymentDate).toBe('05 de cada mês')
  })
})
