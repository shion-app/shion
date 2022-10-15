<script lang="ts" setup>
const { id } = defineProps<{ id: string }>()

let list = $ref<any>()

SelectAllTimeItem(Number(id)).then(data => {
    list = data
})

</script>

<template>{{id}}</template>