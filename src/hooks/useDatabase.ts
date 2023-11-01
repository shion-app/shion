import type { DatabaseError } from '@/modules/database'
import { SqliteErrorEnum } from '@/modules/database/db'

export function useDatabase() {
  const { t } = useI18n()

  function parseError(error) {
    const { fields, code, message } = error as DatabaseError
    return fields.reduce((prev, cur) => {
      switch (code) {
        case SqliteErrorEnum.RAW:
          prev[cur] = t(`database.${SqliteErrorEnum[code]}`, {
            message,
          })
          break
        default:
          prev[cur] = t(`database.${SqliteErrorEnum[code]}`)
          break
      }
      return prev
    }, {})
  }

  return {
    parseError,
  }
}
