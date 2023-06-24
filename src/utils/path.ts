import { isWindows } from './shared'

export const isPathEqual = (base: string, target: string) => isWindows ? base.toLowerCase() == target.toLowerCase() : base == target

/**
 * There is a situation in Windows where the same executable file has two different case file names, such as "explorer. exe "
 */
export const pathToKey = (str: string) => isWindows ? str.toLowerCase() : str
