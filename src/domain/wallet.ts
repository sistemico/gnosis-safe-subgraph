import { Address, BigInt, ethereum, store } from '@graphprotocol/graph-ts'

import { GnosisSafe } from '../../generated/templates/GnosisSafe/GnosisSafe'
import { Wallet, DeploymentLog, WalletOwner, Account } from '../../generated/schema'

import { getOrCreateAccount } from './account'
import { getOrCreateFactory } from './factory'
import { getOrDefault, address, integer } from '../utils'

export function getWallet(proxy: Address): Wallet | null {
  return Wallet.load(proxy.toHexString())
}

export function getOrCreateWallet(proxy: Address, factory: Address, event: ethereum.Event): Wallet | null {
  if (!address.isZeroAddress(proxy)) {
    let wallet = getWallet(proxy)

    if (!wallet) {
      wallet = createWallet(proxy, factory, event)
    }

    return wallet
  }

  return null
}

function createWallet(proxyAddress: Address, factoryAddress: Address, event: ethereum.Event): Wallet {
  let instance = GnosisSafe.bind(proxyAddress)

  let wallet = new Wallet(proxyAddress.toHexString())

  // Track wallet creator (may or may not be an owner)
  let creator = getOrCreateAccount(event.transaction.from)
  creator.createdWalletCount = integer.increment(creator.createdWalletCount)
  creator.save()

  // Track proxy factories
  let factory = getOrCreateFactory(factoryAddress, event)
  factory.walletCount = integer.increment(factory.walletCount)
  factory.save()

  // Audit wallet deployments
  let deployment = new DeploymentLog(`${wallet.id}-${event.transaction.hash.toHexString()}`)
  deployment.sid = deployment.id
  deployment.wallet = wallet.id
  deployment.factory = factory.id
  deployment.creator = creator.id
  deployment.block = event.block.number
  deployment.timestamp = event.block.timestamp
  deployment.transaction = event.transaction.hash
  deployment.save()

  // Wallet related data
  wallet.proxy = proxyAddress
  wallet.factory = factory.id

  wallet.created = event.block.timestamp
  wallet.creator = creator.id
  wallet.deployment = deployment.id

  wallet.version = instance.VERSION()

  // Get initial threshold
  wallet.threshold = getOrDefault<BigInt>(instance.try_getThreshold(), integer.ZERO)

  // Track initial owners
  wallet.ownerCount = integer.ZERO

  let owners = getOrDefault<Address[]>(instance.try_getOwners(), [])

  for (let i = 0; i < owners.length; ++i) {
    addOwner(wallet, getOrCreateAccount(owners[i]))
  }

  // Track singleton for version 1.3.0+
  if (event.parameters.length > 1) {
    let singleton = event.parameters[1].value.toAddress()

    if (singleton) {
      wallet.singleton = singleton

      wallet.save()
    }
  }

  return wallet
}

export function addOwner(wallet: Wallet, account: Account): WalletOwner {
  let owner = new WalletOwner(`${wallet.id}-${account.id}`)
  owner.wallet = wallet.id
  owner.account = account.id
  owner.save()

  wallet.ownerCount = integer.increment(wallet.ownerCount)
  account.walletCount = integer.increment(account.walletCount)

  owner.save()
  wallet.save()
  account.save()

  return owner
}

export function removeOwner(wallet: Wallet, account: Account): void {
  wallet.ownerCount = integer.decrement(wallet.ownerCount)
  account.walletCount = integer.decrement(account.walletCount)

  store.remove('WalletOwner', `${wallet.id}-${account.id}`)
  wallet.save()
  account.save()
}
