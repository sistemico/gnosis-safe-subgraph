import { DataSourceContext, ethereum, log } from '@graphprotocol/graph-ts'

import { GnosisSafe } from '../../generated/templates'

import { getOrCreateWallet } from '../domain/wallet'

export function handleProxyCreation(event: ethereum.Event): void {
  let proxy = event.parameters[0].value.toAddress()
  let factory = event.address

  let wallet = getOrCreateWallet(proxy, factory, event)

  if (wallet) {
    let context = new DataSourceContext()
    context.setString('factory_address', wallet.factory)

    GnosisSafe.createWithContext(proxy, context)
  } else {
    log.warning('Transaction could not be processed: tx_hash={} proxy={} factory={}', [
      event.transaction.hash.toHexString(),
      event.address.toHexString(),
      factory.toHexString(),
    ])
  }
}
