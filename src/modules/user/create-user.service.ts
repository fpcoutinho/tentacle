import {
  type CreateUserInput,
  createUser as insertUser,
  type UserRow
} from './create-user.repository.ts'

export const service = {
  execute: async (input: CreateUserInput): Promise<UserRow> => insertUser(input)
}
