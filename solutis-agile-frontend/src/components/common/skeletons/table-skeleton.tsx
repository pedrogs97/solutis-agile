'use client'

import { Flex, Skeleton } from '@mantine/core'

function TableSkeleton() {
  return (
    <>
      <Flex w="100%" justify="space-between">
        <Flex>
          <Skeleton height={25} width={110} />
          <Skeleton height={25} width={110} ml={20} />
        </Flex>
        <Skeleton height={30} width={180} ml={20} />
      </Flex>
      <Flex mt={15}>
        <Skeleton height={30} width={90} />
        <Skeleton height={30} width={90} ml={20} />
      </Flex>
      <Skeleton height={40} mt={20} />
      <Skeleton height={40} mt={20} />
      <Skeleton height={40} mt={20} />
      <Skeleton height={40} mt={20} />
      <Skeleton height={40} mt={20} />
      <Skeleton height={40} mt={20} />
      <Skeleton height={40} mt={20} />
      <Skeleton height={40} mt={20} />
      <Skeleton height={40} mt={20} />
      <Skeleton height={40} mt={20} />
    </>
  )
}

export default TableSkeleton
