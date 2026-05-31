import { Flex, Skeleton } from '@mantine/core'

function MiniCardSkeleton() {
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
      <Flex mt={15} justify="space-between">
        <Skeleton width={250} height={110} />
        <Skeleton width={250} height={110} />
        <Skeleton width={250} height={110} />
        <Skeleton width={250} height={110} />
      </Flex>
      <Flex mt={15} justify="space-between">
        <Skeleton width={250} height={110} />
        <Skeleton width={250} height={110} />
        <Skeleton width={250} height={110} />
        <Skeleton width={250} height={110} />
      </Flex>
    </>
  )
}

export default MiniCardSkeleton
