<script lang="ts" setup>
const { id } = defineProps<{ id: string }>()

let list = $ref<any>()

// InsertTimeItem(Number(id), [1,2])

// SelectAllTimeItem(Number(id)).then(data => {
//     data = list
//     console.log(data);
// })

</script>

<template>{{id}}</template>