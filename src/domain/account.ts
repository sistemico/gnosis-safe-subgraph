import { Address, BigInt } from '@graphprotocol/graph-ts'

import { Account } from '../../generated/schema'

export function getOrCreateAccount(addr: Address): Account {
  let account = Account.load(addr.toHexString())

  if (!account) {
    account = new Account(addr.toHexString())
    account.createdWalletCount = BigInt.zero()
    account.walletCount = BigInt.zero()

    account.save()
  }

  return account
}
