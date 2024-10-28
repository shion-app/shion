import { fetch } from '@tauri-apps/plugin-http'

interface Announcement {
  date: string
  title: Record<string, string>
  content: Record<string, string>
  popup: boolean
}

export const useAnnouncementStore = defineStore('announcement', () => {
  const configStore = useConfigStore()
  const { config, ready } = storeToRefs(configStore)

  const list = ref<Array<Announcement>>([])

  const announcement = computed(() => {
    if (list.value.length) {
      const { date, title, content, popup } = list.value[0]
      return {
        date: new Date(date),
        title: title[config.value.locale],
        content: content[config.value.locale],
        popup,
      }
    }
    else {
      return {}
    }
  })
  const lastVisited = computed(() => announcement.value.date?.getTime() || 0)
  const hasNew = computed(() => ready.value && (lastVisited.value > 0) && (config.value.announcement.lastVisited != lastVisited.value))
  const needPopup = computed(() => hasNew.value && announcement.value.popup)

  async function refresh() {
    list.value = await (await fetch('https://shion.app/community/announcement.json')).json()
  }

  function readFinish() {
    config.value.announcement.lastVisited = lastVisited.value
  }

  const _timer = new Timer(refresh, calcDuration(6, 'hour'), true)

  return {
    readFinish,
    hasNew,
    refresh,
    announcement,
    needPopup,
  }
})
