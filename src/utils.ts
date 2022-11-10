import { Address, BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts'

export function getOrDefault<T>(result: ethereum.CallResult<T>, defaultValue: T): T {
  return result.reverted ? defaultValue : result.value
}

export function getOrNull<T>(result: ethereum.CallResult<T>): T | null {
  return result.reverted ? null : result.value
}

export namespace address {
  export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'
  export const ZERO_ADDRESS = ADDRESS_ZERO

  export function fromBytes(a: Bytes): Address {
    return changetype<Address>(a)
  }

  export function isZeroAddress(address: Address): boolean {
    return address.toHexString() == ZERO_ADDRESS
  }
}

export namespace integer {
  export let ZERO = BigInt.fromI32(0)
  export let ONE = BigInt.fromI32(1)

  export function fromNumber(value: i32): BigInt {
    return BigInt.fromI32(value)
  }

  export function decrement(value: BigInt, amount: BigInt = ONE): BigInt {
    return value.minus(amount)
  }

  export function increment(value: BigInt, amount: BigInt = ONE): BigInt {
    return value.plus(amount)
  }
}
