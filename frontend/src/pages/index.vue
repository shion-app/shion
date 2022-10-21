<script lang="ts" setup>
import { main } from "../../wailsjs/go/models";

let list = $ref<main.Time[]>();

const router = useRouter();

async function getList() {
  list = await SelectAllTime();
}

getList();

function jump(id: number) {
  router.push(`/time/${id}`);
}

async function deleteTime(id: number) {
  await DeleteTime(id)
  await getList()
}

function calculate(time: number) {
  const hour = (time / (1000 * 60 * 60)).toFixed(1)
  return hour
}

</script>

<template>
  <div flex flex-col h-full>
    <div flex>
      <v-spacer />
      <add-time @refresh="getList" />
    </div>
    <v-divider my />
    <div  flex-1 overflow-y-auto>
      <div
        rounded-2
        border
        m-4
        p-4
        class="group"
        v-for="{ id, name, total } in list"
        :key="id"
        @click="jump(id)"
      >
        <div>{{ name }}</div>
        <div flex>
          <div>{{calculate(total)}}{{$t('hour')}}</div>
          <v-spacer />
          <div flex op-0 group-hover-op-100 transition-opacity-200>
            <v-tooltip location="bottom">
              <template v-slot:activator="{ props  }">
                <div i-mdi:file-edit text-6 cursor-pointer v-bind="props" @click.stop></div>
              </template>
              <span>{{ $t("edit") }}</span>
            </v-tooltip>
            <v-tooltip location="bottom">
              <template v-slot:activator="{ props  }">
                <div i-mdi:delete text-6 cursor-pointer v-bind="props" @click.stop="deleteTime(id)"></div>
              </template>
              <span>{{ $t("delete") }}</span>
            </v-tooltip>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
