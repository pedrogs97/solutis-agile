'use client'

import { createFileRoute, Link } from '@tanstack/react-router'

import classes from '@/styles/not-found.module.css'

export const Route = createFileRoute('/error')({
  component: NotFound,
})

function NotFound() {
  return (
    <div className={classes.root}>
      <div className={classes.label}>404</div>
      <h1 className={classes.title}>Página não encontrada.</h1>
      <p className={classes.description}>
        Infelizmente, esta é apenas uma página 404. Você pode ter digitado o
        endereço errado ou a página foi movida para outro caminho.
      </p>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Link to="/dashboard">Voltar para a página inicial</Link>
      </div>
    </div>
  )
}
