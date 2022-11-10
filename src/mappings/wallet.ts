import { dataSource, log } from '@graphprotocol/graph-ts'

import { AddedOwner, ChangedThreshold, RemovedOwner } from '../../generated/templates/GnosisSafe/GnosisSafe'
import { OwnerAddedLog, OwnerRemovedLog, ThresholdChangedLog } from '../../generated/schema'

import { addOwner, getWallet, removeOwner } from '../domain/wallet'
import { getOrCreateAccount } from '../domain/account'

export function handleAddedOwner(event: AddedOwner): void {
  let wallet = getWallet(event.address)

  if (wallet) {
    let newOwner = getOrCreateAccount(event.params.owner)

    addOwner(wallet, newOwner)

    // Audit
    let log = new OwnerAddedLog(`${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`)
    log.wallet = wallet.id
    log.newOwner = newOwner.id
    log.ownerCount = wallet.ownerCount
    log.block = event.block.number
    log.timestamp = event.block.timestamp
    log.transaction = event.transaction.hash
    log.save()
  } else {
    logWalletNotFound()
  }
}

export function handleRemovedOwner(event: RemovedOwner): void {
  let wallet = getWallet(event.address)

  if (wallet) {
    let ownerRemoved = getOrCreateAccount(event.params.owner)

    removeOwner(wallet, ownerRemoved)

    // Audit
    let log = new OwnerRemovedLog(`${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`)
    log.wallet = wallet.id
    log.ownerRemoved = ownerRemoved.id
    log.ownerCount = wallet.ownerCount
    log.block = event.block.number
    log.timestamp = event.block.timestamp
    log.transaction = event.transaction.hash
    log.save()
  } else {
    logWalletNotFound()
  }
}

export function handleChangedThreshold(event: ChangedThreshold): void {
  let wallet = getWallet(event.address)

  if (wallet) {
    let previousThreshold = wallet.threshold
    let nextThreshold = event.params.threshold

    wallet.threshold = nextThreshold
    wallet.save()

    // Audit
    let log = new ThresholdChangedLog(`${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`)
    log.wallet = wallet.id
    log.previousThreshold = previousThreshold
    log.nextThreshold = nextThreshold
    log.block = event.block.number
    log.timestamp = event.block.timestamp
    log.transaction = event.transaction.hash
    log.save()
  } else {
    logWalletNotFound()
  }
}

function logWalletNotFound(): void {
  let context = dataSource.context()

  log.warning('Wallet not found: proxy={} factory={}', [
    dataSource.address().toHexString(),
    context.getString('factory_address'),
  ])
}
