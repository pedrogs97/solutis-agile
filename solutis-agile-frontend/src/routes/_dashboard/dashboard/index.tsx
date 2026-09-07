'use client'

import { Container, Grid } from '@mantine/core'
import { createFileRoute } from '@tanstack/react-router'
import {
  Building2,
  ClipboardList,
  Database,
  Settings,
  ShoppingCart,
  Users,
} from 'lucide-react'

import DashboardCardsSkeleton from '@/components/common/skeletons/dashboard-cards-skeleton'
import DashboardCard from '@/components/dashboard/dashboard-card'

export const Route = createFileRoute('/_dashboard/dashboard/')({
  // If you want to block this page when already authed, you could redirect here.
  // beforeLoad: ({ context }) => { if (context.auth.isAuthenticated) throw redirect({ to: '/' }) },
  component: DashboardPage,
  pendingComponent: DashboardCardsSkeleton,
})

function DashboardPage() {
  const cardsData = [
    {
      title: 'Comodatos',
      description: 'Gerencie comodatos e termos de responsabilidade.',
      icon: <Database size={24} color="#7950f2" />,
      iconBgColor: '#f3f0ff',
      subject: 'lending',
      links: [
        {
          label: 'Comodatos',
          href: '/lendings',
          subject: 'lending',
        },
        {
          label: 'Termos de Responsabilidade',
          href: '/terms',
          subject: 'term',
        },
      ],
    },
    {
      title: 'Patrimônio',
      description: 'Organização e gerenciamento de patrimônio.',
      icon: <Building2 size={24} color="#1971c2" />,
      iconBgColor: '#e7f5ff',
      subject: 'asset',
      links: [
        {
          label: 'Ativos',
          href: '/assets',
          subject: 'asset',
        },
        {
          label: 'Avaliações Técnicas (FO-PAT-02)',
          href: '/asset-evaluations',
          subject: 'asset',
        },
        {
          label: 'Inventário',
          href: '/inventory',
          subject: 'inventory',
        },
      ],
    },
    {
      title: 'Compras',
      description: 'Acompanhamento do processo de compras.',
      icon: <ShoppingCart size={24} color="#2f9e44" />,
      iconBgColor: '#ebfbee',
      subject: 'supplier',
      links: [
        {
          label: 'Análise e Decisão (FO-AD-01)',
          href: '/purchase-processes',
          subject: 'supplier',
        },
        {
          label: 'Fornecedores',
          href: '/suppliers',
          subject: 'supplier',
        },
        {
          label: 'Notas Fiscais',
          href: '/invoices',
          subject: 'invoice',
        },
      ],
    },
    {
      title: 'Configurações',
      description:
        'Administre usuários, perfis de acesso e audite atividades do sistema.',
      icon: <Settings size={24} color="#e67700" />,
      iconBgColor: '#fff9db',
      subject: 'user',
      links: [
        {
          label: 'Usuários',
          href: '/users',
          subject: 'user',
        },
        {
          label: 'Grupos e Permissões',
          href: '/groups-and-permissions',
          subject: 'group',
        },
        {
          label: 'Atividades e Logs',
          href: '/logs',
          subject: 'log',
        },
      ],
    },
    {
      title: 'Colaboradores',
      description: 'Gestão de colaboradores e suas informações.',
      icon: <Users size={24} color="#0c8599" />,
      iconBgColor: '#e3fafc',
      subject: 'employee',
      links: [
        {
          label: 'Colaboradores',
          href: '/employees',
          subject: 'employee',
        },
      ],
    },
    {
      title: 'Relatórios',
      description: 'Geração de relatórios detalhados para análise e auditoria.',
      icon: <ClipboardList size={24} color="#c2255c" />,
      iconBgColor: '#fff0f6',
      subject: 'report',
      links: [
        {
          label: 'Relatórios',
          href: '/reports',
          subject: 'report',
        },
      ],
    },
  ]

  return (
    <Container size="xl" py="xl">
      <Grid gutter="md">
        {cardsData.map((card, index) => (
          <Grid.Col key={index} span={{ base: 12, sm: 6, lg: 4 }}>
            <DashboardCard
              title={card.title}
              description={card.description}
              icon={card.icon}
              iconBgColor={card.iconBgColor}
              subject={card.subject}
              links={card.links}
            />
          </Grid.Col>
        ))}
      </Grid>
    </Container>
  )
}
