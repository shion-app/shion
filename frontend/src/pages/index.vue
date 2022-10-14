<script lang="ts" setup>

let list = $ref<any>()

SelectAllTime().then(data => {
    console.log(data);
    list = data
})

let router = useRouter()

function jump(id: number) {
    router.push(`/time/${id}`)
}

function addTime() {
// function addTime(name: string) {
    InsertTime("test")
}

</script>

<template>
    <button @click="addTime">+</button>
    <div v-for="{ id, name } in list" @click="jump(id)">{{ name }}</div>
</template>