'use client'

import { Box, Card, Container, Grid, Group, Skeleton } from '@mantine/core'
import { type FC } from 'react'

const DashboardCardSkeleton: FC = () => {
  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      style={{ height: 'fit-content' }}
    >
      <Group justify="space-between" mb="md">
        <Group>
          <Box
            style={{
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Skeleton height={24} width={24} radius="sm" />
          </Box>
          <Skeleton height={24} width={120} radius="sm" />
        </Group>
        <Skeleton height={16} width={16} radius="sm" />
      </Group>

      <Skeleton height={16} width="90%" mb="xs" />
      <Skeleton height={16} width="70%" mb="md" />

      <Box>
        <Skeleton height={14} width={80} mb="xs" />
        <Skeleton height={14} width={100} mb="xs" />
        <Skeleton height={14} width={90} />
      </Box>
    </Card>
  )
}

const DashboardCardsSkeleton: FC = () => {
  return (
    <Container size="xl" py="xl">
      <Grid gutter="md">
        {/* Comodatos - Open */}
        <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
          <DashboardCardSkeleton />
        </Grid.Col>

        {/* Patrimônio - Open */}
        <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
          <DashboardCardSkeleton />
        </Grid.Col>

        {/* Compras - Open */}
        <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
          <DashboardCardSkeleton />
        </Grid.Col>

        {/* Configurações - Open */}
        <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
          <DashboardCardSkeleton />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
          <DashboardCardSkeleton />
        </Grid.Col>
      </Grid>
    </Container>
  )
}

export default DashboardCardsSkeleton
