export const useChangelogStore = defineStore('changelog', () => {
  const [dialog, toggleDialog] = useToggle(false)

  return {
    dialog,
    toggleDialog,
  }
})
