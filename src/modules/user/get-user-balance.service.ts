import { HTTP_STATUS } from '../../shared/constants.ts'
import { APIError } from '../../shared/error/api-error.ts'
import { findUserBalanceById, type UserBalanceRow } from './get-user-balance.repository.ts'

export const service = {
  execute: async (id: string): Promise<UserBalanceRow> => {
    const row = await findUserBalanceById(id)
    if (!row) {
      throw new APIError(HTTP_STATUS.NOT_FOUND, 'not_found', 'User profile not found')
    }

    return row
  }
}
