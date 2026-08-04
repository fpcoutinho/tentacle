import { baseDto } from '../../shared/validation/base-dto.ts'
import type { UserBalanceRow } from './get-user-balance.repository.ts'
import { schema } from './get-user-balance.schema.ts'

export const dto = {
  response: {
    ...baseDto.response,
    body: (balance: UserBalanceRow) =>
      schema.response.body.parse({
        raw: String(balance.shell_balance),
        formatted: `${balance.shell_balance} concha${balance.shell_balance === 1 ? '' : 's'}`,
        currency: `concha${balance.shell_balance === 1 ? '' : 's'}`
      })
  }
}
