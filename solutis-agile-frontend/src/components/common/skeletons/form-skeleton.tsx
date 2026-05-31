'use client'

import { Button, Flex, Grid, Paper, Skeleton } from '@mantine/core'

export default function FormSkeleton() {
  return (
    <Paper shadow="sm" p="md" radius="md" withBorder>
      <Flex direction="column" gap="lg">
        {/* Header Tabs */}
        <Flex gap="md">
          <Skeleton height={30} width={120} radius="md" />
          <Skeleton height={30} width={160} radius="md" />
        </Flex>

        {/* First Row */}
        <Grid>
          <Grid.Col span={6}>
            <Skeleton height={40} radius="md" />
          </Grid.Col>
          <Grid.Col span={6}>
            <Skeleton height={40} radius="md" />
          </Grid.Col>
        </Grid>

        {/* Second Row */}
        <Grid>
          <Grid.Col span={6}>
            <Skeleton height={40} radius="md" />
          </Grid.Col>
          <Grid.Col span={6}>
            <Skeleton height={40} radius="md" />
          </Grid.Col>
        </Grid>

        {/* Third Row */}
        <Grid>
          <Grid.Col span={4}>
            <Skeleton height={40} radius="md" />
          </Grid.Col>
          <Grid.Col span={4}>
            <Skeleton height={40} radius="md" />
          </Grid.Col>
          <Grid.Col span={4}>
            <Skeleton height={40} radius="md" />
          </Grid.Col>
        </Grid>

        {/* Fourth Row */}
        <Grid>
          <Grid.Col span={4}>
            <Skeleton height={40} radius="md" />
          </Grid.Col>
          <Grid.Col span={4}>
            <Skeleton height={40} radius="md" />
          </Grid.Col>
          <Grid.Col span={4}>
            <Skeleton height={40} radius="md" />
          </Grid.Col>
        </Grid>

        {/* Observação (textarea) */}
        <Skeleton height={100} radius="md" />

        {/* File Upload */}
        <Skeleton height={50} radius="md" />

        {/* Footer buttons */}
        <Flex justify="space-between">
          <Button variant="default" disabled w={80} h={36}>
            <Skeleton height={20} width={60} radius="sm" />
          </Button>
          <Button disabled w={100} h={36}>
            <Skeleton height={20} width={80} radius="sm" />
          </Button>
        </Flex>
      </Flex>
    </Paper>
  )
}
