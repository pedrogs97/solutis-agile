import { Container, Text, Title } from '@mantine/core'
import { useEffect } from 'react'

import { logRouteError } from '@/lib/route-error'
import classes from '@/styles/server-error.module.css'

interface ServerErrorProps {
  error?: unknown
  context?: string
}

export function ServerError({ error, context }: ServerErrorProps = {}) {
  useEffect(() => {
    if (error !== undefined) {
      logRouteError(error, context)
    }
  }, [context, error])

  return (
    <div className={classes.root}>
      <Container>
        <div className={classes.label}>500</div>
        <Title className={classes.title}>Ocorreu um erro...</Title>
        <Text size="lg" ta="center" className={classes.description}>
          Nossos servidores não conseguiram lidar com sua solicitação. Atualize
          a página ou tente novamente mais tarde.
        </Text>
      </Container>
    </div>
  )
}
