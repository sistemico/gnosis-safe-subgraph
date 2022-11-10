import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'

import { Factory } from '../../generated/schema'

export function getOrCreateFactory(factoryAddress: Address, event: ethereum.Event): Factory {
  let factory = Factory.load(factoryAddress.toHexString())

  if (!factory) {
    factory = new Factory(factoryAddress.toHexString())
    factory.address = factoryAddress
    factory.added = event.block.timestamp
    factory.walletCount = BigInt.zero()

    factory.save()
  }

  return factory
}
