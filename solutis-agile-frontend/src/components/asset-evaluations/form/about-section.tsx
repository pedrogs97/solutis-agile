'use client'

import { Card, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { Info } from 'lucide-react'

export function AboutSection() {
  return (
    <Card shadow="xs" radius="md" p="lg" withBorder>
      <Group mb="md">
        <ThemeIcon size="lg" radius="md" color="blue" variant="light">
          <Info size={20} />
        </ThemeIcon>
        <div>
          <Title order={4}>Sobre este formulário</Title>
          <Text size="xs" c="dimmed">
            Finalidade, escopo e critérios de decisão do FO-PAT-02
          </Text>
        </div>
      </Group>

      <Stack gap="sm">
        <Text size="sm" lh={1.6}>
          <Text component="span" fw={700}>
            Finalidade —{' '}
          </Text>
          Formalizar a avaliação técnica e patrimonial dos ativos, assegurando
          critérios objetivos para reparo, reaproveitamento, reciclagem, descarte
          e baixa patrimonial, com rastreabilidade completa.
        </Text>

        <Text size="sm" lh={1.6}>
          <Text component="span" fw={700}>
            Escopo —{' '}
          </Text>
          Aplica-se a notebooks, desktops, monitores, celulares, tablets,
          servidores, equipamentos de rede, periféricos, móveis, cadeiras,
          mesas, armários, utensílios, eletrodomésticos e demais bens
          patrimoniais.
        </Text>

        <Text size="sm" lh={1.6}>
          <Text component="span" fw={700}>
            Critérios de decisão —{' '}
          </Text>
          A decisão deve considerar estado físico, funcionalidade, custo de
          recuperação, disponibilidade de peças, vida útil, risco operacional,
          conformidade ambiental e impacto financeiro.
        </Text>
      </Stack>
    </Card>
  )
}
