export const useDialogStore = defineStore('dialog', () => {
  const [dialog, toggleDialog] = useToggle(false)

  return {
    dialog,
    toggleDialog,
  }
})
