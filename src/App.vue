<template>
  <div>
    <div>name: {{ model$.value.name }}</div>
  </div>
</template>

<script lang="ts">
import { onUnmounted } from "vue";
import Form from "./logic/form/form";
export default {
  name: "App",
  setup() {
    const form = new Form({ name: "" }, { name: { required: true } });
    setTimeout(() => {
      form.model$.next({ ...form.model$.value, name: "fuck" });
    }, 2000);
    const formSp = form.validateByModel().subscribe((res) => {
      console.log(res);
    });
    onUnmounted(() => {
      formSp.unsubscribe();
    });
    return form;
  },
};
</script>

<style>
</style>