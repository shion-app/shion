import type { DatabaseError } from '@/modules/database'
import { SqliteErrorEnum } from '@/modules/database/db'

export function useDatabase() {
  const { t } = useI18n()

  function getI18nMessage(error) {
    const { code, message } = error as DatabaseError
    switch (code) {
      case SqliteErrorEnum.RAW:
        return t(`database.${SqliteErrorEnum[code]}`, {
          message,
        })
      default:
        return t(`database.${SqliteErrorEnum[code]}`)
    }
  }

  function parseFieldsError(error) {
    const { fields } = error as DatabaseError
    return fields.reduce((prev, cur) => {
      prev[cur] = getI18nMessage(error)
      return prev
    }, {})
  }

  function isUniqueError(error) {
    return (error as DatabaseError).code == SqliteErrorEnum.SQLITE_CONSTRAINT_UNIQUE
  }

  return {
    parseFieldsError,
    getI18nMessage,
    isUniqueError,
  }
}
